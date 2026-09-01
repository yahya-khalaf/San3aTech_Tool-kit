export const firmwareRuntime = `flowchart TD
  START_FW([Firmware Runtime Debug])

  START_FW --> RUNS{Does code run}
  RUNS -->|No| SERIAL_CHECK[Check serial monitor output]
  RUNS -->|Yes but wrong behavior| CHOOSE_IO{Is it a Sensor or Actuator issue?}

  SERIAL_CHECK -->|No output| BAUD[Check baud rate]
  SERIAL_CHECK -->|Boot logs present| EXC_CHECK[Exception or Guru Meditation]

  EXC_CHECK -->|Yes| DECODE[Decode stack trace]
  EXC_CHECK -->|No| CHOOSE_IO

  DECODE --> FIX_CODE[Fix memory bug or null pointer]
  FIX_CODE --> REUPLOAD[Reupload firmware]

  REUPLOAD --> START_FW

  CHOOSE_IO -->|Sensor/Input| GO_INPUT[Go to Input Troubleshoot]
  CHOOSE_IO -->|Motor/Output| GO_OUTPUT[Go to Output Troubleshoot]
`;
