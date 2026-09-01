export const outputTroubleshoot = `flowchart TD
  OUTPUT_START([Output Device Issues])

  OUTPUT_START --> TYPE{Device type}
  TYPE -->|Servo| SERVO
  TYPE -->|Motor| MOTOR
  TYPE -->|Relay| RELAY

  SERVO --> EXT_PWR[Use external 5V supply]
  SERVO --> CAP[Add decoupling capacitor]

  MOTOR --> DRIVER[Use motor driver not GPIO]
  MOTOR --> NOISE[Add flyback diode]

  RELAY --> TRANSISTOR[Use transistor driver stage]
`;
