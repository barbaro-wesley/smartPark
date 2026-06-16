#!/bin/sh
set -e

if [ "${DEMO_MODE}" = "true" ]; then
  exec python raspberry_estacionamento.py --demo
elif [ -n "${PORTA_SERIAL}" ]; then
  exec python raspberry_estacionamento.py --porta "${PORTA_SERIAL}"
else
  exec python raspberry_estacionamento.py
fi
