<div align="center">
  <br>
  <br>
  <a href="https://github.com/Coda-Research-Group/AlphaFind"><img src="https://raw.githubusercontent.com/Coda-Research-Group/AlphaFind/main/static/logo.png" alt="AlphaCharges" width="220"></a>
  <br>
  <br>
</div>

# AlphaFind: Discover structure similarity across the entire known proteome

[![DOI](https://zenodo.org/badge/732580263.svg)](https://doi.org/10.5281/zenodo.11085862)

![GitHub Actions](https://github.com/Coda-Research-Group/AlphaFind/actions/workflows/ci.yml/badge.svg)

**[AlphaFind](https://alphafind.fi.muni.cz)** is a web-based search engine that allows for structure-based search of the entire [AlphaFold Protein Structure Database](https://alphafold.ebi.ac.uk). Uniprot ID, PDB ID, or Gene Symbol is accepted as input – the engine will return the most similar proteins found within AlphaFold DB, with an option for additional search to extend and refine the results. The search results are grouped by their source organism and displayed along with several similarity metrics. 3D visualizations of the structural superposition of the proteins are provided, and text filters can be used to find specific organisms or Uniprot IDs. For details about the methodology and usage, please see the [manual](https://github.com/Coda-Research-Group/AlphaFind/wiki/Manual). This website is free and open to all users and there is no login requirement.

Vector embeddings and model weights used in [AlphaFind](https://alphafind.fi.muni.cz) are available at [AlphaFind: Discover structure similarity across the entire known proteome – data and model | Czech national repository](https://data.narodni-repozitar.cz/general/datasets/d35zf-1ja47).
This project uses [USalign](https://github.com/pylelab/USalign).

## Code Structure

The codebase is divided into three folders:
- `training` (model training, index building)
- `api` (backend)
- `ui` (frontend)
 
See the `README.md` files in each folder for more details.

## Installation and execution

Prerequisites / Dependencies:
- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or later)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)


### Steps

1. Clone this repository:
```sh
git clone https://github.com/Coda-Research-Group/AlphaFind.git
```

2. Run Docker compose, which will do the following:
  - build the docker image for `api/`, `ui/` and `training/`,
  - run the `training/` container to prepare the necessary data structures,
  - run the `api/` container (the backend),
  - run the `ui/` container (the frontend).

Use `-d` switch for a detached process.
```sh
docker compose up --build
```

4. Open `http://localhost:8081` in your browser.

### Data use

The `training/data/cifs` folder contains a small subset of the AlphaFold DB comprising 109 proteins.
The full AlphaFold DB can be downloaded from [here](https://alphafold.ebi.ac.uk/download).

To use your own protein data:
1. Place your .cif files in the `training/data/cifs` directory before running `run.sh`.
2. Ensure your files follow the naming convention: `AF-[UniProtID]-F1-model_v4.cif`.

For the full AlphaFold DB, download it from [here](https://alphafold.ebi.ac.uk/download) and place the files in the same directory.


**Tested on**: Ubuntu 22.04 LTS, Fedora Linux 40 (Workstation Edition)

## Cite Us
If you use AlphaFind in your research, please cite the following publication:

```
@article{prochazka2024alphafind,
  title={AlphaFind: discover structure similarity across the proteome in AlphaFold DB},
  author={Proch{\'a}zka, David and Slanin{\'a}kov{\'a}, Ter{\'e}zia and Olha, Jaroslav and Ro{\v{s}}inec, Adri{\'a}n and Gre{\v{s}}ov{\'a}, Katar{\'\i}na and J{\'a}no{\v{s}}ov{\'a}, Miriama and {\v{C}}ill{\'\i}k, Jakub and Porubsk{\'a}, Jana and Svobodov{\'a}, Radka and Dohnal, Vlastislav and others},
  journal={Nucleic Acids Research},
  pages={gkae397},
  year={2024},
  publisher={Oxford University Press}
}
```

## Additional Information
- **Publisher**: Intelligent Systems for Complex Data Research Group
- **Object Identifier**: [doi/10.5281/zenodo.11085862](https://zenodo.org/doi/10.5281/zenodo.11085862)
- **Keywords**: similarity search, protein structure, AlphaFold, protein database, web application 
- **Creators and Active Contributors**: [Terézia Slanináková](https://github.com/TerkaSlan), [David Procházka](https://github.com/ProchazkaDavid)
- **Inactive Contributors**: [Jakub Čillík](https://github.com/xcillik),
- **Object Type**: Software
- **Title**: AlphaFind: discover structure similarity across the proteome in AlphaFold DB
- **Publication Date**: 2024-05-15
- **Publication**: [doi.org/10.1093/nar/gkae397](https://doi.org/10.1093/nar/gkae397)


## License

MIT license
