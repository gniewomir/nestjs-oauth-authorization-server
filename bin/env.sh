#!/bin/bash

set -e  # Exit on any error

npm run env | sed -ne '/# BEGIN ENV FILE/,$ p'
