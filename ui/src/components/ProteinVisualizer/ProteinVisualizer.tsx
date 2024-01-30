import { faAngleLeft, faAngleRight, faExpand } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Component, Stage } from "ngl";
import { CSSProperties, ChangeEvent, Dispatch, MutableRefObject, useEffect, useRef, useState } from "react"
import { Button, Form, OverlayTrigger, Spinner, Tooltip } from "react-bootstrap";
import { ColorHEX, makeColorTransitions, makeTransparencyTransitions } from "../../common/utils";
import "./protein-visualizer.scss";
import { Representation } from "../../common/enums";

const defaultColors: ColorHEX[] = [
    '#FD9D0D',
    '#0D6EFD',
];

enum PreviewState {
    Initial,
    Success,
    Error,
}

type Controls = {
    representation: Representation,
    visibility: {[key: string]: boolean},
    opacity: {[key: string]: number},
};

const defaultCommonRepresentations = {
    "cartoon": {
        visible: false,
    },
    "surface": {
        visible: false,
    },
    "ball+stick": {
        visible: false,
    },
    "spacefill": {
        visible: false,
    },
    "trace": {
        visible: false,
    },
    "licorice": {
        visible: false,
    },
    "tube": {
        visible: false,
    },
};

const singleVisibleRepresentations = {
    "cartoon": {
        colorScale: "Spectral",
        colorScheme: "residueindex",
        visible: true,
    },
    "surface": {
        sele: "polymer",
        colorScheme: "electrostatic",
        // colorDomain: [-0.3, 0.3],
        surfaceType: "ms",
        visible: false,
    },
    "ball+stick": {
        visible: false,
    },
    "spacefill": {
        visible: false,
    },
    "trace": {
        visible: false,
    },
    "licorice": {
        multipleBond: true,
        visible: false,
    },
    "tube": {
        visible: false,
    },
};

function setupComponent(component: Component, name: string, color: ColorHEX, transparency: number,defaultRepresentation: Representation) {
    component.setName(name);

    if (defaultRepresentation === Representation.Cartoon) {
        component.addRepresentation('cartoon', {
            color: color,
            visible: true,
        });

        component.autoView();

        return component;
    }

    if (defaultRepresentation === Representation.Tube) {
        component.addRepresentation('tube', {
            color: color,
            visible: true,
            opacity: transparency,
        });

        component.autoView();

        return component;
    }

    component.addRepresentation('cartoon', {
        color: color,
        visible: true,
    });

    component.autoView();

    return component;
}

function setupVisualizer(stage: MutableRefObject<Stage | null>,
                         uniProtIds: string[],
                         setPreviewState: Dispatch<React.SetStateAction<PreviewState>>,
                         defaultRepresentation: Representation) {
    const colors = uniProtIds.length === 2 ? defaultColors : [defaultColors[0], ...makeColorTransitions(uniProtIds.length)];
    const transparencies = uniProtIds.length === 2 ? [1, 1] : [1, ...makeTransparencyTransitions(uniProtIds.length - 1).reverse()];

    const promises = [];
    for (let i = 0; i < uniProtIds.length; i++) {
        promises.push(
            stage.current?.loadFile(`https://alphafold.ebi.ac.uk/files/AF-${uniProtIds[i]}-F1-model_v3.pdb`)
            .then(o => {
                if (o instanceof Component)
                    return setupComponent(o, uniProtIds[i], colors[i], transparencies[i], defaultRepresentation);
            })
        );
    }

    Promise.all(promises)
    .then(responses => {
        for (let i = 1; i < responses.length; i++) {
            // @ts-expect-error - private property
            (responses[0])?.superpose(responses[i]);
        }
        // Unused
        // When identical 3D models, shift one sliiightly
        // if ((responses[0])?.name === (responses[1])?.name)
        //     (responses[0])?.setPosition([0.1,0,0]);

        (responses[0])?.updateRepresentations({
            position: true,
        });
        // Focus and center on object or the whole scene
        // responses[0].autoView();
        stage.current?.autoView();

        // setTimeout(() => {
        setPreviewState(PreviewState.Success);
        // }, 500);
    })
    .catch(error => {
        setPreviewState(PreviewState.Error);
        console.error(error);
    });
}

function adjustOpacity(stage: Stage | null, setControls: Dispatch<React.SetStateAction<Controls>>) {
    // Neccessary if stage was disposed in meantime
    if (stage === null)
        return () => {};

    return (event: ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        const name = event.currentTarget.id;
        const val = Number.parseFloat(event.currentTarget.value);

        stage.eachComponent(c => {
            if (c.name === name)
                c.eachRepresentation(r => {
                    r.setParameters({
                        opacity: val,
                    });
                });
        });

        // Rerender UI controls
        setControls(prev => {
            const newControls = {...prev};
            newControls.opacity[name] = val;

            return newControls;
        });
    };
}

function resetOpacity(stage: Stage | null) {
    // Neccessary if stage was disposed in meantime
    if (stage === null)
        return;

    stage.eachComponent(c => {
        c.eachRepresentation(r => {
            r.setParameters({
                opacity: 1,
            });
        });
    });
}

function shiftObjects(stage: Stage) {
    stage.eachComponent(c => {
        c.setPosition([-15, 0, 0]);
    });
}

function showAllObjects(stage: Stage | null) {
    // Neccessary if stage was disposed in meantime
    if (stage === null)
        return;

    stage.eachComponent(c => {
        c.setVisibility(true);
    });
}

function setupControlsObj<T>(uniProtIds: string[], defaultValue: T) {
    const res: {[key: string]: T} = {};

    uniProtIds.forEach(e => {
        res[e] = defaultValue;
    });

    return res;
}

function fixRepresentations(stage: Stage | null, representation: Representation, uniProtIds: string[], visibleCount: number) {
    // Neccessary if stage was disposed in meantime
    if (stage === null)
        return;

    stage.eachComponent(c => {
        c.removeAllRepresentations();
        
        // Add new based on visible count
        if (visibleCount === 1)
            c.addRepresentation(representation, {
                ...singleVisibleRepresentations[representation as keyof typeof defaultCommonRepresentations],
                visible: true,
            });
        else if (visibleCount === 2)
            c.addRepresentation(representation, {
                ...defaultCommonRepresentations[representation as keyof typeof defaultCommonRepresentations],
                color: defaultColors[uniProtIds.indexOf(c.name)],
                visible: true,
            });
    });
}

function changeRepresentation(stage: Stage | null, setControls: Dispatch<React.SetStateAction<Controls>>, uniProtIds: string[]) {
    // Neccessary if stage was disposed in meantime
    if (stage === null)
        return () => {};

    return (event: ChangeEvent<HTMLSelectElement>) => {
        event.preventDefault();
        const newRepre = event.currentTarget.value as Representation;

        // Fix incompatible cases
        if (newRepre === Representation.Surface)
            resetOpacity(stage);
        else
            showAllObjects(stage);

        // Rerender UI controls
        setControls(prev => {
            const newControls = {...prev};

            newControls.representation = newRepre;
            newControls.visibility = setupControlsObj(Object.keys(newControls.visibility), true);
            newControls.opacity = setupControlsObj(Object.keys(newControls.opacity), 1);

            return newControls;
        });

        fixRepresentations(stage, newRepre, uniProtIds, 2);
    };
}

function changeObjectVisibility(stage: Stage | null, controls: Controls, setControls: Dispatch<React.SetStateAction<Controls>>, uniProtIds: string[]) {
    // Neccessary if stage was disposed in meantime
    if (stage === null)
        return () => {};

    return (event: ChangeEvent<HTMLInputElement>) => {
        const name = event.currentTarget.name;
        const visible = event.currentTarget.checked;

        const visibilities = controls.visibility;

        stage.eachComponent(c => {
            if (c.name !== name)
                return;

            c.setVisibility(visible);
            visibilities[name] = visible;

            // Rerender UI controls
            setControls(prev => {
                const newControls = {...prev};
                newControls.visibility[name] = visible;
                newControls.opacity = setupControlsObj(Object.keys(newControls.opacity), 1);

                return newControls;
            });
        });

        fixRepresentations(stage, controls.representation, uniProtIds, Object.values(visibilities).filter(value => value).length);
    };
}

function makeRepresentationSelectElement(onRepresentationChange: (event: ChangeEvent<HTMLSelectElement>) => void, representation: Representation) {
    return (
        <div>
            <Form.Group>
                {/* <Form.Label>Representation</Form.Label> */}
                <Form.Select aria-label="Select representation" size="sm" onChange={onRepresentationChange} value={representation}>
                    <option disabled>Select representation</option>
                    <option value="cartoon">Cartoon</option>
                    <option value="surface">Surface</option>
                    <option value="ball+stick">Ball + Stick</option>
                    <option value="spacefill">Spacefill</option>
                    <option value="trace">Trace</option>
                    <option value="licorice">Licorice</option>
                    <option value="tube">Tube</option>
                </Form.Select>
            </Form.Group>
        </div>
    );
}

function makeVisibilityCheckboxElement(onVisibilityChange: (event: ChangeEvent<HTMLInputElement>) => void, uniProtIds: string[], visibility: {[key: string]: boolean}) {
    return (
        <>
            <hr />
            <div className="mb-2">Visibility</div>
            <Form.Group>
                <Form.Check label={(
                    <OverlayTrigger overlay={
                        <Tooltip>{uniProtIds[0]}</Tooltip>
                    }>
                        <div className="text-truncate" style={{maxWidth: 120 + "px", color: defaultColors[0]}}>{uniProtIds[0]}</div>
                    </OverlayTrigger>
                )}
                    type="switch"
                    id={uniProtIds[0]}
                    checked={visibility[uniProtIds[0]]}
                    onChange={onVisibilityChange}
                    name={uniProtIds[0]} />
            </Form.Group>
            <Form.Group>
                <Form.Check label={(
                    <OverlayTrigger overlay={
                        <Tooltip>{uniProtIds[1]}</Tooltip>
                    }>
                        <div className="text-truncate" style={{maxWidth: 120 + "px", color: defaultColors[1]}}>{uniProtIds[1]}</div>
                    </OverlayTrigger>
                )}
                    type="switch"
                    id={uniProtIds[1]}
                    checked={visibility[uniProtIds[1]]}
                    onChange={onVisibilityChange}
                    name={uniProtIds[1]} />
            </Form.Group>
        </>
    );
}

function makeOpacityRangeElement(onOpacityChange: (event: ChangeEvent<HTMLInputElement>) => void, uniProtIds: string[], controls: Controls) {
    return (
        <>
            <hr />
            <div className="mb-2">Transparency</div>
            <Form.Group>
                <Form.Label className="mb-0">
                    <div className="text-truncate" style={{maxWidth: 120 + "px", color: defaultColors[0]}}>{uniProtIds[0]}</div>
                </Form.Label>
                <Form.Range
                    disabled={!controls.visibility[uniProtIds[0]]}
                    name={uniProtIds[0]}
                    id={uniProtIds[0]}
                    onChange={onOpacityChange}
                    min={0}
                    max={1}
                    step={0.05}
                    value={controls.opacity[uniProtIds[0]]} />
            </Form.Group>
            <Form.Group>
                <Form.Label className="mb-0">
                    <div className="text-truncate" style={{maxWidth: 120 + "px", color: defaultColors[1]}}>{uniProtIds[1]}</div>
                </Form.Label>
                <Form.Range
                    disabled={!controls.visibility[uniProtIds[1]]}
                    name={uniProtIds[1]}
                    id={uniProtIds[1]}
                    onChange={onOpacityChange}
                    min={0}
                    max={1}
                    step={0.05}
                    value={controls.opacity[uniProtIds[1]]} />
            </Form.Group>  
        </>
    );
}

function makeControls(
    visible: boolean,
    uniProtIds: string[],
    stage: Stage | null,
    controls: Controls,
    setControls: Dispatch<React.SetStateAction<Controls>>,
    requestLoader: () => void) {
    // Shift all objects by a little if control panel is visible by default
    if (stage !== null)
        shiftObjects(stage);

    const onRepresentationChange = (event: ChangeEvent<HTMLSelectElement>) => {
        requestLoader();
        changeRepresentation(stage, setControls, uniProtIds)(event);
    };

    const onVisibilityChange = (event: ChangeEvent<HTMLInputElement>) => {
        requestLoader();
        changeObjectVisibility(stage, controls, setControls, uniProtIds)(event);
    };
    
    return (
        <div className={visible ? "controls visible" : "controls"}>
            <OverlayTrigger overlay={
                <Tooltip>
                    Toggle Fullscreen
                </Tooltip>
            }>
                <Button className="fullscreen-btn" onClick={
                    () => {
                        if (stage !== null)
                            // @ts-expect-error - function argument not needed
                            stage.toggleFullscreen();
                    }
                }>
                    <FontAwesomeIcon icon={faExpand} />
                </Button>
            </OverlayTrigger>
            
            {makeRepresentationSelectElement(onRepresentationChange, controls.representation)} 

            <div>
                {makeVisibilityCheckboxElement(onVisibilityChange, uniProtIds, controls.visibility)}

                {controls.representation !== Representation.Surface && makeOpacityRangeElement(adjustOpacity(stage, setControls), uniProtIds, controls)}
            </div>
        </div>
    );
}

function setupState(stageElementId: string, bgColor: ColorHEX, spin: boolean): [Stage, () => void] {
    const stage = new Stage(stageElementId, {
        backgroundColor: bgColor,
    });
    stage.setSpin(spin);
    

    const handler = () => stage.handleResize();
    window.addEventListener("resize", handler, false);

    return [stage, handler];
}

function cleanUpStage(stage: MutableRefObject<Stage | null>) {
    if (stage.current === null)
        return;

    stage.current.removeAllComponents();
    stage.current.dispose();

    stage.current = null;
}

type Props = {
    uniProtIds: string[];
    stageElementId: string;
    height?: number;
    bgColor?: ColorHEX;
    allowControlPanel?: boolean;
    allowFullscreen?: boolean;
    defaultRepresentation?: Representation;
    spin?: boolean;
};

export function ProteinVisualizer({
    uniProtIds,
    stageElementId,
    height,
    bgColor = "#ffffff",
    allowControlPanel = false,
    defaultRepresentation = Representation.All,
    spin = false,
}: Props ) {
    const [previewState, setPreviewState] = useState(PreviewState.Initial);
    const [isControlPanelVisible, setControlPanelVisible] = useState(true);
    const [controls, setControls] = useState({
        representation: Representation.Cartoon,
        visibility: setupControlsObj(uniProtIds, true),
        opacity: setupControlsObj(uniProtIds, 1),
    });

    const stage = useRef<Stage | null>(null);

    useEffect(() => {
        setPreviewState(PreviewState.Initial);

        // No need to continue if no UniProt IDs
        if (uniProtIds.length === 0)
            return;

        let resizeHandler: null | (() => void) = null;

        const timeoutPointer = setTimeout(() => {
            const [newStage, handler] = setupState(stageElementId, bgColor, spin);
            stage.current = newStage;
            resizeHandler = handler;
            setupVisualizer(stage, uniProtIds, setPreviewState, defaultRepresentation);
        }, 400);

        // Clean up on unmount
        return () => {
            clearTimeout(timeoutPointer);

            if (resizeHandler !== null)
                window.removeEventListener("click", resizeHandler);

            cleanUpStage(stage);
        };
    }, [JSON.stringify(uniProtIds)]);

    function requestLoader() {
        setPreviewState(PreviewState.Initial);

        setTimeout(() => setPreviewState(PreviewState.Success), 1000);
    }

    const style: CSSProperties = {};
    if (height !== undefined)
        style.height = height + "px";
    
    return (
        <div className="ngl-container" style={style}>
            <div id={stageElementId} className={previewState === PreviewState.Success ? "w-100 h-100" : "w-100 h-100 visually-hidden"}></div>

            {uniProtIds.length > 0 && (<>
                {allowControlPanel && (
                    <Button className="controls-toggle" onClick={() => setControlPanelVisible(prev => !prev)}>
                        {isControlPanelVisible ? (<FontAwesomeIcon icon={faAngleLeft} />) : <FontAwesomeIcon icon={faAngleRight} />}
                    </Button>
                )}
                {allowControlPanel && makeControls(isControlPanelVisible, uniProtIds, stage.current, controls, setControls, requestLoader)}

                {previewState === PreviewState.Initial && (
                    <Spinner animation="border" role="status" variant="secondary" className="mx-auto"><span className="visually-hidden">Loading...</span></Spinner>
                )}
                {previewState === PreviewState.Error && (<span className="disabled"><i>Error while loading 3D preview</i></span>)}
            </>)}
        </div>
    );
}
