#!/bin/bash

QUERY_ID=$1
# <protein_id>,<protein_id>,...
PROTEINS=$2
# True/False
CACHE_RESULT=$3
# How many proteins we're computing scores for
LIMIT=$4
# Which protein to start from
OFFSET=$5

RESULTS_FOLDER='/eph/results'

mkdir -p /eph/results
mkdir -p /eph/initiated_computations

# Mark that this process is computing the query
touch "/eph/initiated_computations/${QUERY_ID}"

# Create temporary folder
mkdir -p "/eph/partial_scores/${QUERY_ID}"

# Extract database proteins
IFS=',' read -ra DATASET_IDS <<<"${PROTEINS}"

# Compute scores for a single query protein and a single database protein
compute_scores() {
    QUERY_ID=$1
    PROTEIN_ID=$2

    QUERY_PROTEIN_PATH="/data/cifs/AF-${QUERY_ID}-F1-model_v3.cif"
    DATASET_EXCTRACTED_PROTEIN_PATH="/data/cifs/AF-${PROTEIN_ID}-F1-model_v3.cif"

    /home/alphafind/USalign "${QUERY_PROTEIN_PATH}" "${DATASET_EXCTRACTED_PROTEIN_PATH}" -outfmt 2 | tail -n 1 | awk -F ' ' '{print $3,$5,$8,$9,$11}' >"/eph/partial_scores/${QUERY_ID}/${PROTEIN_ID}.txt"
}
export -f compute_scores

# Sets the default number of parallel jobs if not specified otherwise
if [[ -z "${N_PARALLEL_JOBS}" ]]; then
    N_PARALLEL_JOBS=20
fi

# Run at most N_PARALLEL_JOBS jobs in parallel
parallel --jobs "${N_PARALLEL_JOBS}" "compute_scores ${QUERY_ID} {}" ::: "${DATASET_IDS[@]}"

N_DATASET_PROTEINS="${#DATASET_IDS[@]}"

# Merge results
for ((i = 0; i < N_DATASET_PROTEINS; i++)); do
    PROTEIN_ID="${DATASET_IDS[i]}"

    if [[ "${CACHE_RESULT}" == "True" ]]; then
        echo -n "${PROTEIN_ID} " | tee -a "${RESULTS_FOLDER}/${QUERY_ID}-limit=${LIMIT}-offset=${OFFSET}.txt"
        tee -a "${RESULTS_FOLDER}/${QUERY_ID}-limit=${LIMIT}-offset=${OFFSET}.txt" <"/eph/partial_scores/${QUERY_ID}/${PROTEIN_ID}.txt"
    else
        echo -n "${PROTEIN_ID} "
        cat "/eph/partial_scores/${QUERY_ID}/${PROTEIN_ID}.txt"
    fi
done

# Remove temporary files
rm -r "/eph/partial_scores/${QUERY_ID}"
rm "/eph/initiated_computations/${QUERY_ID}"
