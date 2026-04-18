#!/bin/bash
# Fix Cargo.lock version for Anchor compatibility
if [ -f Cargo.lock ]; then
    sed -i 's/^version = 4$/version = 3/' Cargo.lock
    echo "Fixed Cargo.lock version"
else
    echo "No Cargo.lock found"
fi
