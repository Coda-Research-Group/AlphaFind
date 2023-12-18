#!/bin/bash

gunicorn --timeout 600 -b 0.0.0.0:8000 -w 1 'run_server:app'
