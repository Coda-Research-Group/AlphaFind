import argparse
import logging
import os

from alphafind_training.utils import load_pickle, save_pickle
from tqdm import tqdm

LOG = logging.getLogger(__name__)


def create_mapping(bucket_data_path, output_path):
    """
    Creates an index mapping protein id to its bucket id and position in the bucket's DataFrame.
    The index is saved as a pickle file.

    Args:
        bucket_data_path (str): Path to the bucket data
        output_path (str): Path where the index will be saved

    Returns:
        None
    """
    LOG.info('Creating the index')
    protein_id_to_position_mapping = dict()

    for bucket_name in tqdm(os.listdir(bucket_data_path)):
        bucket_data = load_pickle(os.path.join(bucket_data_path, bucket_name))

        for dataframe_protein_index, protein_id in enumerate(bucket_data.index):
            bucket_id = int(bucket_name.replace('class-', '').replace('.pkl', ''))

            protein_id_to_position_mapping[protein_id] = (bucket_id, dataframe_protein_index)

        del bucket_data

    LOG.info(f'Saving the index to {output_path}')
    save_pickle(output_path, protein_id_to_position_mapping)

    LOG.info("DONE")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Create protein-to-bucket mapping")
    parser.add_argument('--bucket-path', type=str, required=True, help='Path to the bucket data')
    parser.add_argument('--output', type=str, required=True, help='Path where the index will be saved')

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format='[%(asctime)s][%(levelname)-5.5s][%(name)-.20s] %(message)s')

    create_mapping(args.bucket_path, args.output)
