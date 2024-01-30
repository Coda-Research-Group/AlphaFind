import argparse
import logging
import os

from tqdm import tqdm

from utils import load_pickle, save_pickle

LOG = logging.getLogger(__name__)


def create_index(bucket_data_path, output_path):
    LOG.info('Creating the index')
    protein_id_to_position_mapping = dict()

    for bucket_name in tqdm(os.listdir(bucket_data_path)):
        bucket_data = load_pickle(f'{bucket_data_path}/{bucket_name}')

        for dataframe_protein_index, protein_id in enumerate(bucket_data.index):
            bucket_id = int(bucket_name.replace('class-', '').replace('.pkl', ''))

            protein_id_to_position_mapping[protein_id] = (bucket_id, dataframe_protein_index)

        del bucket_data

    LOG.info(f'Saving the index to {output_path}')
    save_pickle(output_path, protein_id_to_position_mapping)

    LOG.info("DONE")


'''
Creates an index mapping protein id to its bucket id and position in the bucket's DataFrame.
The index is saved as a pickle file.

Implementation details:
- The `create_index` goes through all the bucket data files and
  creates the mapping in the form of a tuple (bucket_id, dataframe_protein_index).
- Prints the progress every 20 buckets.

EXAMPLE USE:
create_protein_bucket-mapping.py \
    --bucket-data-path './data/bucket-data' \
    --output-path './data/bucket-mapping.pickle'
'''
if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--bucket-path', type=str, help='Path to the bucket data')
    parser.add_argument('--output', type=str, help='Path where the index will be saved')

    args = parser.parse_args()

    assert args.bucket_path is not None
    assert args.output is not None

    create_index(args.bucket_path, args.output)
