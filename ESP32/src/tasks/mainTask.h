#pragma once
#include <Arduino.h>
#include "NeoPi.h"

extern NeoPi led;

void main_task(void *pvParameters);

void main_task(void *pvParameters) {
  while (1) {
    for (int i = 0; i < 50; i++){
      led.setBrightness(i);
      led.send();
      delay(20);
    }
  }
}