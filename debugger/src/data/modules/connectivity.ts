export const connectivity = `flowchart TD
  NET_START([Connectivity Issues])

  NET_START --> TYPE{Connection type}
  TYPE -->|WiFi| WIFI
  TYPE -->|Bluetooth| BT

  WIFI --> SSID[Check SSID and password]
  WIFI --> SIGNAL[Check signal strength]
  WIFI --> RESET{Board resets when WiFi starts}
  RESET -->|Yes| GO_ELECTRICAL[Go to Electrical Power]
  
  WIFI --> DROPS{WiFi drops?}
  DROPS -->|Yes| POWER_SPIKE{Causes brownout?}
  POWER_SPIKE -->|Yes| GO_ELECTRICAL

  BT --> PAIR[Check pairing mode]
  BT --> STACK[Check BLE stack compatibility]
`;
