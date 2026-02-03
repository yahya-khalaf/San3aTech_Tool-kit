export const coreSystem = `flowchart TD
  S([Start ESP32 Debugging])

  S --> IDE{Which IDE}
  IDE -->|MicroBlocks| MB1[Connection icon visible]
  IDE -->|Arduino IDE| ARD1[ESP32 board package installed]
  IDE -->|PlatformIO| PIO1[Platform and board configured]

  MB1 -->|No| FIX_DRV[Install CP210x or CH340 driver]
  ARD1 -->|No| FIX_BOARDPKG[Install ESP32 board package]
  PIO1 -->|No| FIX_PIO[Install platform package]

  FIX_DRV --> CHECK_PORTS[Does serial port appear]
  FIX_BOARDPKG --> CHECK_PORTS
  FIX_PIO --> CHECK_PORTS

  MB1 -->|Yes| CHECK_PORTS
  ARD1 -->|Yes| CHECK_PORTS
  PIO1 -->|Yes| CHECK_PORTS

  CHECK_PORTS -->|No| CABLE[Use data USB cable and different port]
  CHECK_PORTS -->|Yes| TRY_UPLOAD[Try upload]

  TRY_UPLOAD -->|Timeout error| BOOT_SEQ[Use BOOT button or IO0 to GND]
  TRY_UPLOAD -->|Other error| FLASH_SET[Check flash settings and erase flash]
  TRY_UPLOAD -->|Success| GO_FIRMWARE[Go to Firmware Runtime]
`;
