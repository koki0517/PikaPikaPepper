#pragma once
#include <Arduino.h>
#include "RMT_WS2812.h"

enum class Colors {
  RED,
  GREEN,
  BLUE,
  YELLOW,
  PURPLE,
  WHITE,
  BLACK
};

class NeoPi {
public:
  void init();
  void setBrightness(uint8_t brightness);
  void setPixel(uint32_t index, uint8_t red, uint8_t green, uint8_t blue);
  void setColor(uint32_t index, Colors color);
  void send();
  void clear();
private:
  RMT_WS2812 ws2812b = RMT_WS2812(RMT_CHANNEL_0, GPIO_NUM_2, 2);
};

void NeoPi::init() {
  ws2812b.begin();
  ws2812b.clear();
}

void NeoPi::setBrightness(uint8_t brightness) {
  ws2812b.setBrightness(brightness);
}

void NeoPi::setPixel(uint32_t index, uint8_t red, uint8_t green, uint8_t blue) {
  ws2812b.setPixel(index, red, green, blue);
}

void NeoPi::setColor(uint32_t index, Colors color) {
  switch (color) {
    case Colors::RED:
      ws2812b.setPixel(index, 255, 0, 0);
      break;
    case Colors::GREEN:
      ws2812b.setPixel(index, 0, 255, 0);
      break;
    case Colors::BLUE:
      ws2812b.setPixel(index, 0, 0, 255);
      break;
    case Colors::YELLOW:
      ws2812b.setPixel(index, 255, 255, 0);
      break;
    case Colors::PURPLE:
      ws2812b.setPixel(index, 255, 0, 255);
      break;
    case Colors::WHITE:
      ws2812b.setPixel(index, 255, 255, 255);
      break;
    case Colors::BLACK:
      ws2812b.setPixel(index, 0, 0, 0);
      break;
  }
}

void NeoPi::send() {
  ws2812b.refresh();
}

void NeoPi::clear() {
  ws2812b.clear();
}