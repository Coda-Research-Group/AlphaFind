# AlphaFind Training

## How to run using docker
1. Build the training image
`docker build -t alphafind:train -f ./Dockerfile .`

2. Run the training inside the container
```bash
docker run \
    -v ./data:/training/data \
    -v ./models:/training/models \
    -e WANDB_MODE=offline \
    alphafind:train
```
Note: In **Windows**, you may need to use absolute paths instead of relative paths, e.g.:
```bash
docker run \
    -v C:\\alphafind-training\\data:/training/data
    -v C:\\alphafind-training\\models:/training/models
    alphafind:train
```

3. After running, you'll have the following files/folders:
- `./models/<model-path>` - the weights, optimizer state and train losses of the model - used for cluster prediction
- `./data/bucket-data` - the predicted data clusters
- `./data/bucket-mapping.pkl` - mapping between the data clusters and the protein names

## How to run locally

The training is a 5-step process:
1. Create the embedding
Assuming that there are `n` cif files in `./data/cif` directory:
```bash
python3 create-embedding.py --input=./data/cifs --output=./data/embedding.pkl --granularity 10
```
will produce an embedding `n`x`45`

Note: we get `45` from `granularity=10`, where `granularity`^2-`granularity`/ 2 = 45

2. Cluster the embedding
```bash
python3 cluster.py --input=./data/embedding.pkl --output=data/kmeans.idx --n-clusters=2
```

3. Train the model
```bash
python3 train.py --input=./data/embedding.pkl --kmeans-path=data/kmeans.idx --output-model-dir=models/ --n-classes=2
```

4. Collect buckets of data cluster predictions
```bash
python3 create-buckets.py --input=./data/embedding.pkl --model-dir-path=./models/ --output-chunks=./data/chunks --output-predictions=./data/overall --output-bucket-path ./data/bucket-data/
```
Note: This will take the newest model from the directory specified by `--model-dir-path`. You can also input a specific model's directory - e.g. `--model-dir-path=./models/model-MLP--pretrained-False--n_classes-2--epochs-10--batchsize=32--dimensionality-45--2024-01-26-11-44-02`

5. Create a mapping that locates each protein within the bucket
```bash
python3 create-protein-bucket-mapping.py --bucket-path=./data/bucket-data/ --output=./data/bucket-mapping.pkl
```