export const electricalPower = `flowchart TD
  PWR_START([Electrical and Power Issues])

  PWR_START --> BROWN{Brownout detected}
  PWR_START --> RESET[Random resets]
  PWR_START --> GND[Missing common ground]

  BROWN --> USB_PWR[Use stronger USB port]
  BROWN --> EXT_SUPPLY[Use stable external supply]
  BROWN --> CORE_VER[Check core version issues]

  RESET --> WDT[Watchdog reset from blocking loop]
  RESET --> EXC_BOOT[Startup exception]

  GND --> COMMON_GND[Ensure common ground across system]
`;
