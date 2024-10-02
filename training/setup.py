from setuptools import find_packages, setup

# Read the contents of requirements.txt
with open('requirements.txt') as f:
    requirements = f.read().splitlines()

# Read the contents of requirements-dev.txt
with open('requirements-dev.txt') as f:
    dev_requirements = [line for line in f.read().splitlines() if line and not line.startswith('-r')]
print(dev_requirements)

setup(
    name="alphafind_training",
    version="0.0.1",
    packages=find_packages(where='alphafind_training'),
    package_dir={'': 'alphafind_training'},
    install_requires=requirements,
    extras_require={
        'dev': dev_requirements,
    },
    author="Terézia Slanináková",
    author_email="slaninakova@ics.muni.cz",
    description="AlphaFold training -- setup for the similarity search on vast protein data",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/Coda-Research-Group/AlphaFind",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
