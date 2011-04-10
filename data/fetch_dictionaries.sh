#!/bin/bash

dicts=(TWL06.txt sowpods.txt zingarelli2005.txt)
zips=(twl06.zip sowpods.zip zinga.zip)

for i in $(seq 0 2); do
    dict=${dicts[i]};
    if [ ! -f $dict ]; then
        zip=${zips[i]}
        wget http://www.isc.ro/lists/$zip
        unzip $zip
        rm $zip
    fi
done
