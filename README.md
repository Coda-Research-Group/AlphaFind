<div align="center">
  <br>
  <br>
  <a href="https://github.com/Coda-Research-Group/AlphaFind"><img src="https://raw.githubusercontent.com/Coda-Research-Group/AlphaFind/main/static/logo.png" alt="AlphaCharges" width="220"></a>
  <br>
  <br>
</div>

# AlphaFind: Discover structure similarity across the entire known proteome

**[AlphaFind](https://alphafind.fi.muni.cz)** is a web-based search engine that allows for structure-based search of the entire [AlphaFold Protein Structure Database](https://alphafold.ebi.ac.uk). Uniprot ID, PDB ID, or Gene Symbol is accepted as input – the engine will return the most similar proteins found within AlphaFold DB, with an option for additional search to extend and refine the results. The search results are grouped by their source organism and displayed along with several similarity metrics. 3D visualizations of the structural superposition of the proteins are provided, and text filters can be used to find specific organisms or Uniprot IDs. For details about the methodology and usage, please see the [manual](https://github.com/Coda-Research-Group/AlphaFind/wiki/Manual). This website is free and open to all users and there is no login requirement.

Vector embeddings and model weights used in [AlphaFind](https://alphafind.fi.muni.cz) are available at [AlphaFind: Discover structure similarity across the entire known proteome – data and model | Czech national repository](https://data.narodni-repozitar.cz/general/datasets/d35zf-1ja47).
This project uses [USalign](https://github.com/pylelab/USalign).

## Code Structure

The codebase is divided into three folders:
- `training` (model training, index building)
- `api` (backend)
- `ui` (frontend)
 
See the `README.md` files in each folder for more details.

## Running locally

Prerequisites:
- [Docker](https://docs.docker.com/get-docker/)

1. Clone this repository
2. Run `./run.sh` in your terminal
3. Open `http://localhost:8081` in your browser

The `training/data/cifs` folder contains a small subset of the AlphaFold DB comprising 109 proteins.
The full AlphaFold DB can be downloaded from [here](https://alphafold.ebi.ac.uk/download).

## License

MIT license
