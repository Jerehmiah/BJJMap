FROM mongo

COPY corePositions.json /corePositions.json
CMD mongoimport --host database --file corePositions.json --db bjjmap_database_1 --collection=corePositions