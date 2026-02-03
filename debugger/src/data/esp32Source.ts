export const esp32Mermaid = `flowchart TD
  %% Start
  S([Start ESP32 Debugging])

  %% Layer 1: Environment
  S --> L1{Layer 1 Environment}
  L1 --> IDE{Which IDE or Tool}
  IDE -->|MicroBlocks| MB1[Check connection icon visible]
  IDE -->|Arduino IDE| ARD1[Check board package installed]
  IDE -->|PlatformIO| PIO1[Check platform and board selection]
  IDE -->|Other| OTH1[Check tool docs]

  MB1 --> MB_NO[No connection icon]
  MB1 --> MB_YES[Icon visible proceed]

  ARD1 --> ARD_NO[Not installed]
  ARD1 --> ARD_YES[Installed proceed]

  PIO1 --> PIO_NO[Board not in platform]
  PIO1 --> PIO_YES[Platform ok proceed]

  MB_NO --> FIX_DRV1[Install USB driver CP210x or CH340 and restart]
  ARD_NO --> FIX_BOARDPKG[Install ESP32 board package via Board Manager]
  PIO_NO --> FIX_PIO[Install board package in PlatformIO]

  FIX_DRV1 --> CHECK_PORTS1[Do COM or tty ports appear]
  FIX_BOARDPKG --> CHECK_PORTS1
  FIX_PIO --> CHECK_PORTS1
  MB_YES --> CHECK_PORTS1
  ARD_YES --> CHECK_PORTS1
  PIO_YES --> CHECK_PORTS1

  %% Layer 2: Connection
  CHECK_PORTS1 --> L2{Layer 2 Connection}
  L2 --> PORT_NO[No port appears]
  L2 --> PORT_YES[COM port visible]

  PORT_NO --> CABLE_CHECK[Check USB cable is data cable not charge only]
  PORT_NO --> TRY_OTHER_PORTS[Try other USB port usb hub direct]
  PORT_NO --> INSTALL_DRIVER[Install correct VCP driver from vendor]
  INSTALL_DRIVER --> CHECK_PORTS1

  CABLE_CHECK --> DRIVER_GUIDE[Install drivers if needed]
  TRY_OTHER_PORTS --> CHECK_PORTS1

  PORT_YES --> SELECT_PORT[Select correct COM port in IDE]
  SELECT_PORT --> AUTOBOOT[Try upload]

  AUTOBOOT --> UPLOAD_FAIL{Upload fails or times out?}
  UPLOAD_FAIL --> UPTIMEOUT[Error timed out waiting for packet header]
  UPLOAD_FAIL --> OTHER_UPLOAD_ERR[Other upload error shown]
  UPLOAD_FAIL --> UPLOAD_OK[Upload succeeded -> Layer3]

  UPTIMEOUT --> FIX_BOOTSEQ[Try hold BOOT while pressing EN or connect IO0 to GND for manual boot]
  UPTIMEOUT --> DISCONNECT_TXRX[Disconnect external TX0 RX0 wiring during upload]
  UPTIMEOUT --> REPLACE_CABLE[Swap to known good data USB cable]
  UPTIMEOUT --> CHANGE_PORT[Try different USB port or PC]
  UPTIMEOUT --> CHECK_DRIVERS[Verify CP210x or CH340 driver installed and working]
  FIX_BOOTSEQ --> RETRY_UPLOAD[Retry upload after boot sequence]
  DISCONNECT_TXRX --> RETRY_UPLOAD
  REPLACE_CABLE --> RETRY_UPLOAD
  CHANGE_PORT --> RETRY_UPLOAD
  CHECK_DRIVERS --> RETRY_UPLOAD

  RETRY_UPLOAD --> UPLOAD_FAIL

  OTHER_UPLOAD_ERR --> CHECK_FLASH_SETTINGS[Check board, flash mode, flash freq and partition scheme]
  CHECK_FLASH_SETTINGS --> ERASE_FLASH[Try esptool erase_flash then upload]
  ERASE_FLASH --> RETRY_UPLOAD

  UPLOAD_OK --> L3{Layer 3 Firmware}

  %% Layer 3: Firmware Behavior
  L3 --> RUNS[Code runs but no expected behavior]
  L3 --> NO_RUNS[Code not running at all]
  NO_RUNS --> SERIAL_OUTPUT[Open Serial Monitor check for boot messages]
  SERIAL_OUTPUT --> NO_SERIAL[No serial output]
  SERIAL_OUTPUT --> SERIAL_OK[Serial prints boot logs]

  NO_SERIAL --> BAUD_CHECK[Check correct baud in Serial Monitor]
  NO_SERIAL --> PIN_RESET[Check EN and BOOT pins not shorted]
  NO_SERIAL --> FLASH_ERR[Board stuck in bootloader or flash corrupted]
  FLASH_ERR --> ERASE_FLASH
  BAUD_CHECK --> SERIAL_OK
  PIN_RESET --> SERIAL_OK

  SERIAL_OK --> CHECK_EXCEPTIONS[Look for exceptions stack traces]
  CHECK_EXCEPTIONS --> EXC_STACK[Has exception or Guru Meditation]
  CHECK_EXCEPTIONS --> NO_EXC[No exceptions seen proceed]

  EXC_STACK --> DECODE_STACK[Use addr2line or enable stack trace decode]
  DECODE_STACK --> FIX_BUGS[Fix code causing exception memory leak or null pointer]
  FIX_BUGS --> REUPLOAD
  REUPLOAD --> L3

  NO_EXC --> L4{Layer 4 Execution}

  %% Layer 4: Execution Logic
  L4 --> LOGIC_FAIL[Logic runs but features fail]
  L4 --> WORKS[Program works]

  LOGIC_FAIL --> CHECK_PINMAP[Check pin assignments and reserved pins]
  LOGIC_FAIL --> CHECK_LIBS[Check library versions and compatibility]
  LOGIC_FAIL --> SENSOR_DEBUG[Read raw sensor values debug prints]
  LOGIC_FAIL --> RESOURCE_FAIL[Check memory heap and freeRTOS tasks]

  RESOURCE_FAIL --> HEAP_TRACE[Check for heap fragmentation and free memory]
  HEAP_TRACE --> REDUCE_RTOS[Reduce RTOS task memory usage or increase stack]
  REDUCE_RTOS --> REUPLOAD

  CHECK_LIBS --> UPDATE_LIBS[Update or lock library versions then rebuild]
  CHECK_PINMAP --> MOVE_PIN[Move to safe pin not reserved for flash or PSRAM]
  SENSOR_DEBUG --> VERIFY_WIRING[Verify wiring and common ground]
  VERIFY_WIRING --> L5{Layer 5 Peripherals}

  %% Layer 5: Peripherals
  L5 --> ADC_ISSUES[Analog readings wrong or saturated]
  L5 --> I2C_ISSUES[I2C devices not responding]
  L5 --> SPI_ISSUES[SPI devices fail]
  L5 --> PWM_SERVO[Jittery servo or motor control]
  L5 --> WIFI_BLUETOOTH[Connectivity issues with WiFi or Bluetooth]

  ADC_ISSUES --> ADC2_CHECK{Is WiFi or Bluetooth active}
  ADC2_CHECK --> ADC2_YES[If yes moving sensor needed]
  ADC2_CHECK --> ADC2_NO[If no check wiring and pull down]

  ADC2_YES --> MOVE_TO_ADC1[Move sensors to ADC1 pins GPIO32 to GPIO39]
  ADC2_NO --> CHECK_PULLDOWN[Add 10k pull down resistor and stable reference]

  I2C_ISSUES --> CHECK_PULLUPS[Check pull up resistors 4k7]
  I2C_ISSUES --> SDA_SCL_SWAP[Check SDA SCL not swapped]
  I2C_ISSUES --> ADDRESS_CONFLICT[Check device address conflicts]
  I2C_ISSUES --> BUS_LENGTH[Shorten bus and add pullups]

  SPI_ISSUES --> CHECK_CS[Verify CS pin handling]
  SPI_ISSUES --> CHECK_MODE[Check SPI mode and frequency]
  SPI_ISSUES --> ISOLATE_BUS[Try running device alone]

  PWM_SERVO --> SEPARATE_POWER[Use external 5V supply for servos]
  PWM_SERVO --> ADD_CAP[Add decoupling capacitors near motor]
  PWM_SERVO --> AVOID_BOARD_5V[Do not power motors from board regulator]

  WIFI_BLUETOOTH --> WIFI_NO_CONNECT[WiFi fails to connect]
  WIFI_BLUETOOTH --> WIFI_DROPS[WiFi connects then drops]
  WIFI_BLUETOOTH --> BT_PAIR[Bluetooth pairing fails]

  WIFI_NO_CONNECT --> CHECK_SSID_PASS[Check SSID and password correct]
  WIFI_NO_CONNECT --> DNS_DHCP[Confirm DHCP or static IP settings]
  WIFI_NO_CONNECT --> SIGNAL_LOW[Check signal strength and antenna connection]
  WIFI_NO_CONNECT --> FW_BLOCK[Firewall or router blocking client]

  WIFI_DROPS --> POWER_SPIKE[Does connecting cause brownout or reset]
  POWER_SPIKE --> SEE_LAYER6[Go to Layer6 Electrical checks]

  BT_PAIR --> BLE_PRIVACY[Check BLE pairing mode and address filtering]
  BT_PAIR --> BT_STACK[Check Bluetooth stack compatibility of board]

  %% Layer 6: Electrical
  L6{Layer 6 Electrical}
  SEE_LAYER6 --> L6
  L5 --> L6

  L6 --> BROWNOUT[BROWNOUT detector triggered]
  L6 --> NO_POWER[No power to board]
  L6 --> RESET_LOOPS[Random resets watchdog or boot loop]
  L6 --> GROUND_ISSUES[Floating or missing common ground]

  BROWNOUT --> CHECK_USB_POWER[Check USB cable and port current rating]
  BROWNOUT --> EXTERNAL_POWER[Use stable external 5V supply]
  BROWNOUT --> REDUCE_TX_POWER[Reduce WiFi TX power or disable WiFi during test]
  BROWNOUT --> CORE_ISSUE[Check core and SDK version for known brownout regression]
  CORE_ISSUE --> UPDATE_CORE[Try roll back or update Arduino core]
  CORE_ISSUE --> DISABLE_BROWNOUT[As last resort disable brownout in menuconfig or efuse]

  NO_POWER --> LED_OFF[No power LED]
  NO_POWER --> CHECK_VIN[Check VIN regulator orientation and input voltage]
  NO_POWER --> REPLACE_BOARD[Try another dev board]
  LED_OFF --> POWER_TRACE[Check fuse and input rail]

  RESET_LOOPS --> WDT[Watchdog reset due to blocking loops]
  RESET_LOOPS --> EXCEPTION_BOOT[Exception during startup]
  RESET_LOOPS --> BROWNOUT

  WDT --> ADD_YIELD[Add delay yield or task watchdog reset calls]
  WDT --> OPTIMIZE_LOOP[Optimize heavy loops and avoid blocking calls]

  GROUND_ISSUES --> ENSURE_GND[Ensure common ground between sensors and board]
  GROUND_ISSUES --> ADD_CAP[Add ground plane or decoupling caps]

  %% Escalation and Tools
  ANYTIME[At any time] --> CAPTURE_LOGS[Capture serial logs and device boot messages]
  CAPTURE_LOGS --> SAVE_SESSION[Save logs and node choices for instructor]
  SAVE_SESSION --> ESCALATE[Escalate with device info and logs]

  %% Link errors back to fixes
  RETRY_UPLOAD --> CAPTURE_LOGS
  REUPLOAD --> CAPTURE_LOGS
  REUPLOAD --> L4
  MOVE_TO_ADC1 --> CAPTURE_LOGS
  FIX_BUGS --> CAPTURE_LOGS

  %% Terminal nodes
  WORKS --> END_OK([Problem resolved])
  ESCALATE --> END_ESC([Escalated to instructor or forum])

  style S stroke:#333,stroke-width:2px
  style END_OK fill:#d4f8d4,stroke:#0a0
  style END_ESC fill:#fde2e2,stroke:#a00
`;
