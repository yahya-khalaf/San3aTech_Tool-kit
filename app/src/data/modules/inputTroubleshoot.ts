export const inputTroubleshoot = `flowchart TD
  INPUT_START([Sensor Input Issues])

  INPUT_START --> TYPE{Sensor type}
  TYPE -->|Analog| ADC
  TYPE -->|I2C| I2C
  TYPE -->|SPI| SPI

  ADC --> WIFI_CHECK{WiFi or Bluetooth active}
  WIFI_CHECK -->|Yes| ADC1[Move sensor to GPIO32-39]
  WIFI_CHECK -->|No| ADC_WIRE[Check wiring and pull down resistor]

  I2C --> PULLUPS[Check pull up resistors]
  I2C --> ADDR[Check address conflict]
  I2C --> SDA_SCL[Check pins swapped]

  SPI --> CS_CHECK[Check CS handling]
  SPI --> MODE[Check SPI mode]
`;
