#include <Arduino.h>
#include "BluetoothSerial.h"
#include <Wire.h>

#include <nvs.h>
#include <nvs_flash.h>

#include "NeoPi.h"
#include "tasks/mainTask.h"

NeoPi led;
BluetoothSerial SerialBT;

void clearNVS() {
  int err;
  err=nvs_flash_init();
  Serial.println("nvs_flash_init: " + err);
  err=nvs_flash_erase();
  Serial.println("nvs_flash_erase: " + err);
}

void hueToRGB(int16_t hue, uint8_t &r, uint8_t &g, uint8_t &b) {
  float s = 1.0; // 彩度を最大に設定
  float l = 0.5; // 明度を50に設定
  float c = (1 - abs(2 * l - 1)) * s;
  float x = c * (1 - abs(fmod(hue / 60.0, 2) - 1));
  float m = l - c / 2;

  float rf, gf, bf;

  if (hue < 60) {
    rf = c; gf = x; bf = 0;
  } else if (hue < 120) {
    rf = x; gf = c; bf = 0;
  } else if (hue < 180) {
    rf = 0; gf = c; bf = x;
  } else if (hue < 240) {
    rf = 0; gf = x; bf = c;
  } else if (hue < 300) {
    rf = x; gf = 0; bf = c;
  } else {
    rf = c; gf = 0; bf = x;
  }

  rf += m;
  gf += m;
  bf += m;

  r = rf * 255;
  g = gf * 255;
  b = bf * 255;
}

void setup() {
  Serial.begin(115200);
  SerialBT.begin("Pepperkun");
  clearNVS();
  led.init();
  led.clear();
  led.setBrightness(10);
  led.setColor(0, Colors::RED);
  led.setColor(1, Colors::RED);
  led.send();
}

void loop() {
  if (SerialBT.available() >= 4) {
    byte inBuf[4];
    SerialBT.readBytes(inBuf, 4);

    int16_t hue1 = (inBuf[1] << 8) | inBuf[0];
    int16_t hue2 = (inBuf[3] << 8) | inBuf[2];

    Serial.print("Hue1: ");
    Serial.println(hue1);
    Serial.print("Hue2: ");
    Serial.println(hue2);

    uint8_t r1, g1, b1;
    uint8_t r2, g2, b2;

    // 色相をRGBに変換
    hueToRGB(hue1, r1, g1, b1);
    hueToRGB(hue2, r2, g2, b2);

    Serial.printf("%d,%d,%d %d,%d,%d", r1, g1, b1, r2, g2, b2);

    // LEDに反映
    led.setPixel(0, r1, g1, b1);
    led.setPixel(1, r2, g2, b2);
    led.send();

    SerialBT.printf("Recieved Hue1: %d (%d,%d,%d), Hue2: %d (%d,%d,%d)\n", hue1, r1, g1, b1, hue2, r2, g2, b2);
  }
}