// ============================================================
//  ПЕРЕВОДЫ СОДЕРЖИМОГО data.js НА КЫРГЫЗСКИЙ (ky) И АНГЛИЙСКИЙ (en)
//
//  Русский текст остаётся в data.js. Здесь только переводы:
//  items: по id проекта (title, desc, story: problem/solution/result/steps/parts/team/next).
//         Таблицы steps/parts/team/next заменяются целиком. Если перевода нет, показывается русский.
//  tags:  перевод русских тегов (латинские названия плат и модулей не переводятся).
//  Имена людей и названия плат не переводятся.
// ============================================================
const DATA_TR = {
  en: {
    roles: { engineer: "Engineer", tester: "Tester", docs: "Documentation", pr: "PR and outreach" },
    groups: {
      "mir-1": "Six teams in two squads: engineers, testers, documentation and PR.",
      "mir-2": "Students of group MiR(b)-2-26: projects, achievements and members.",
      "mir-3": "Students of group MiR(b)-3-26: projects, achievements and members."
    },
    squads: { "Отряд А": "Squad A", "Отряд В": "Squad B", "Состав группы": "Group members" },
    tags: {
      "Макетирование": "Prototyping", "Гироскоп": "Gyroscope", "3D-печать": "3D printing", "Датчик влажности": "Moisture sensor",
      "Реле": "Relay", "Мини-помпа": "Mini pump", "Радар 60 ГГц": "60 GHz radar", "Тепловизор 8×8": "8×8 thermal camera",
      "ПИ-регулятор": "PI controller", "Фоторезисторы": "Photoresistors", "Сервопривод": "Servo", "Конечный автомат": "State machine",
      "ИИ": "AI", "Компьютерное зрение": "Computer vision", "Умный город": "Smart city"
    },
    ach: [
      { date: "International Space Games, Moscow", title: "Best media specialists",
        text: "Our team won the media category at the International Space Games hosted by Bauman Moscow State Technical University. The Kabar news agency reported on it." }
    ],
    kabar: {
      title: "Kyrgyz students named the best media specialists at the Space Games",
      text: "The International Space Games were held in Moscow at Bauman Moscow State Technical University. Kabar, the Kyrgyz national news agency, wrote about our success."
    },
    gallery: ["International Space Games", "At the games venue", "Red Square, Moscow"],
    items: {
      "smart-garage": {
        title: "Smart garage on Arduino", author: "MIR-1 team",
        desc: "A model gate that lifts by itself when a car comes closer than 20 cm and closes again after 3 seconds.",
        story: {
          problem: "To open the gate by hand, the driver has to get out of the car or fiddle with the lock. It is inconvenient and slows down every arrival.",
          solution: "We built a self-contained gate model. An HC-SR04 ultrasonic rangefinder measures the distance to the car, and an SG90 servo lifts the gate when the car is closer than 20 cm and lowers it after 3 seconds.",
          result: "A working physical prototype. The sensor reacts within 0.1 s, and the gate opened and closed in every test run.",
          steps: [["Waiting", "The gate is closed (0°) and the sensor keeps measuring the distance."], ["Detection", "An object is closer than 20 cm."], ["Opening", "The servo turns to 90° and waits 3 seconds."], ["Closing", "The gate returns to its starting position (0°)."]],
          parts: [["Arduino Uno", "Microcontroller running all the logic."], ["HC-SR04", "Ultrasonic sensor for contactless distance measurement."], ["SG90 servo", "Motor that raises and lowers the gate."], ["Wiring", "5V/GND power, servo on pin D3 (PWM), sensor Trig/Echo on pins D9 and D10."]],
          team: [["Developer and circuit designer", "Built the circuit, debugged the hardware, assembled the model."], ["Programmer", "C++ sketch in Arduino IDE, distance-based algorithm."]],
          next: [["RFID access", "RC522 module: the gate opens only for the owner's card or key fob."], ["Two-factor check", "Open only when a car is at the gate and the card is accepted."], ["LDR light", "Garage lights turn on by themselves when it gets dark."], ["Smartphone control", "Bluetooth HC-05 or Wi-Fi: open or close the gate from a phone."], ["IR barrier", "The gate stops if something is in the doorway."]]
        }
      },
      "esp32-mini-radar": {
        title: "Mini radar on ESP32",
        desc: "A mini radar on ESP32: an ultrasonic sensor on a servo scans the area, measures the distance to objects and beeps when something gets close.",
        story: {
          result: "A working mini-radar prototype: it detects objects, measures the distance to them and warns with a sound when they get close.",
          parts: [["ESP32", "Microcontroller."], ["HC-SR04", "Ultrasonic distance sensor."], ["SG92R servo", "Turns the sensor to scan."], ["TMB12A05 buzzer", "Sound signal."], ["Arduino IDE and C++", "Development environment and language."], ["Breadboard", "Assembling the device from electronic parts."], ["3D printing", "A case is planned."]],
          team: [["Шаршенбеков Дамир, MIR-1-26", "Project development, circuit assembly, wiring, ESP32 programming, testing and tuning."]]
        }
      },
      "digisand": {
        title: "DigiSand: an hourglass",
        desc: "An electronic hourglass on Arduino Nano with a gyroscope: the device simulates sand pouring through.",
        story: {
          solution: "We built the project on Arduino; it works using a gyroscope.",
          result: "We managed to make a full sand simulation.",
          parts: [["Arduino Nano", "Microcontroller."], ["Gyroscope", "The sensor the device works with."], ["Wokwi", "Online electronics simulator."], ["3D printing", "Making the case."]],
          next: [["Real-time clock", "The project still lacks a real-time clock."]]
        }
      },
      "starys": {
        title: "STARYS: a swarm of builder modules for Mars",
        desc: "A swarm of identical ESP32 cube modules for preparing a base on Mars: they find each other, lock together and work as one distributed computer.",
        story: {
          problem: "There are no people on Mars yet, but a base has to be prepared in advance. Construction can't be controlled from Earth: a signal takes up to 22 minutes to get there.",
          solution: "We designed identical 80 mm cube modules on ESP32. They find each other, lock together with switchable magnets and pass power and data through their faces without wires. The cubes roll using an internal flywheel and take removable attachments: tracks, an arm, a bucket, a solar panel.",
          result: "The firmware passes about 8,000 automated checks without errors. In the MuJoCo simulation, module v0.3 needs 7,710 rpm of the flywheel to climb onto a neighbour on Mars (limit 12,000). When the leader \"breaks\", the swarm elects a new one in 0.5–0.8 s. A module weighs 397 g, and there is a full set of drawings to the GOST ESKD standard. The prototype has not been tested on hardware yet.",
          steps: [["Search", "Identical modules find each other."], ["Coupling", "Switchable magnets join the modules; power and data pass through the face without wires."], ["Leader", "Connected modules work as one distributed computer: they elect a leader and share tasks."], ["Storage", "Data is stored in three copies."]],
          parts: [["80 mm ESP32 cube module", "The identical modules the swarm is made of."], ["Switchable magnets", "Lock modules to each other."], ["Internal flywheel", "Lets the cube roll."], ["Removable attachments", "Tracks, arm, bucket, solar panel."]],
          team: [["Джоробеков Эрназар, lead engineer", "Firmware, calculations, 3D model."], ["Турдушова Амина, \"Speaker\"", "Project defence, demo, video."], ["Майрамбекова Таңшоола, \"Test master\"", "3D printing, assembly, measurements and tests."]]
        }
      },
      "esp32-rc-car": {
        title: "Radio-controlled car on ESP32",
        desc: "A car and a joystick remote on two ESP32 boards talk to each other directly by radio (ESP-NOW): no phone or router needed.",
        story: {
          problem: "Typical home-made cars are controlled over Bluetooth or Wi-Fi, need a phone or a router, and the connection can lag.",
          solution: "We built a car and a joystick remote on two ESP32 boards that talk directly by radio (ESP-NOW protocol). The remote reads the joystick position and sends a command; the car receives it and drives four motors through an L298N driver.",
          result: "The car works without a router or phone: range up to 10–15 m indoors and up to 100 m outdoors, response under 5 ms.",
          steps: [["Joystick", "The remote reads the joystick position."], ["Command", "The remote sends a command by radio (ESP-NOW)."], ["Receiving", "The ESP32 on the car receives the command."], ["Driving", "Four motors are driven through the L298N driver."]],
          parts: [["ESP32 (two boards)", "One in the joystick remote, one on the car."], ["ESP-NOW", "Direct radio protocol between the boards."], ["L298N driver", "Drives the car's four motors."], ["18650 batteries", "Power."], ["Arduino IDE and C++", "Development environment and language."]],
          team: [["Саитов Атай", "MIR(b)-3-26"], ["Ашырбеков Хантейиш", "MIR(b)-3-26"]]
        }
      },
      "acousticguard": {
        title: "AcousticGuard: a noise detector on ESP32",
        desc: "A noise detector on ESP32 with signal smoothing, an on-screen scale and a light alarm. When noise goes above 50% it sends a Telegram notification.",
        story: {
          problem: "A budget microphone module has low sensitivity and gives an unstable signal without software filtering.",
          solution: "We built a noise detector on ESP32 with pulse smoothing, a level scale on the screen and a light alarm. When noise goes above 50%, the device sends a Telegram notification over Wi-Fi.",
          result: "A working prototype with a 40 ms response and spam protection (1 message per minute).",
          steps: [["Filtering", "The microphone signal is smoothed: pulses are filtered in software."], ["Display", "The noise level is shown as a scale on the screen, with a light alarm."], ["Notification", "Above 50% noise the device sends a Telegram message over Wi-Fi."], ["Spam protection", "No more than one message per minute."]],
          parts: [["ESP32", "Microcontroller."], ["KY-037", "Microphone module."], ["OLED SSD1306", "Screen with the noise-level scale."], ["Telegram Bot API", "Sending notifications to Telegram."], ["Arduino C++", "Programming language."]],
          team: [["Андрей", "MiR-3-26"], ["Раатбек", "MiR-3-26"]]
        }
      },
      "auto-trash-bin": {
        title: "Auto trash bin",
        desc: "A trash bin on Arduino Nano that opens by itself when someone comes close.",
        story: {
          problem: "A pedal trash bin is awkward to use.",
          solution: "We made an automatic trash bin.",
          result: "The bin opens by itself when you come close.",
          parts: [["Arduino Nano", "Microcontroller."]]
        }
      },
      "pixie": {
        title: "Pixie: a smart lamp on ESP32",
        desc: "A smart lamp on ESP32: it turns on in the dark when a person is nearby and switches off by itself when nobody is there.",
        story: {
          problem: "Ordinary lighting uses electricity even when nobody is in the room.",
          solution: "We created a smart lamp on ESP32 that turns on in the dark when it detects a person and switches off automatically if no movement or presence is detected for a set time.",
          result: "A working smart-lamp prototype with automatic control and a 3D-printed case.",
          steps: [["On", "In the dark, the lamp turns on when a person is detected."], ["Off", "If no movement or presence is detected for a set time, the lamp turns itself off."]],
          parts: [["ESP32 DevKit", "Microcontroller."], ["HLK-LD2410C", "Sensor that detects a person."], ["WS2812", "The lamp's LEDs."], ["5 V power supply", "Power."], ["3D printing", "The case is 3D-printed."]]
        }
      },
      "cyberbuddy": {
        title: "CyberBuddy: a desktop companion robot",
        desc: "A desktop robot on ESP32: it notices a person, turns on the light, watches the temperature, shows its mood with a face on the screen and writes to Telegram.",
        story: {
          problem: "Desk devices don't react to what happens around them. The light and fan run all the time or are switched by hand, and nobody notices overheating in time.",
          solution: "We created a desktop companion robot on ESP32. It notices a person at the desk and turns on the light, measures the temperature and turns on a fan when it overheats (above 28 °C). It shows its state with a face on the OLED screen: sleep, joy or alarm. Through the Telegram bot @CyberBuddy_bot it sends notifications and answers the commands /start, /stop, /status and /alert.",
          result: "A working prototype with automatic control. A three-state machine (IDLE, ACTIVE, ALERT) switches modes by motion and temperature. Everything runs on 5 V USB power only; no 220 V mains is used.",
          steps: [["Person at the desk", "The robot notices a person and turns on the light."], ["Overheating", "Above 28 °C the fan turns on."], ["Face on screen", "The robot shows its state on the OLED screen: sleep, joy or alarm."], ["States", "A three-state machine (IDLE, ACTIVE, ALERT) switches modes by motion and temperature."], ["Telegram", "The bot @CyberBuddy_bot sends notifications and answers /start, /stop, /status and /alert."]],
          parts: [["ESP32 DevKit v1 with Expansion Shield", "Microcontroller."], ["PIR HC-SR501", "Motion sensor."], ["DHT11", "Temperature and humidity sensor."], ["OLED SSD1306 0.96″ (I2C)", "Screen showing the robot's face."], ["Relay modules", "Switch the light and the fan."], ["USB power, 5 V", "Runs on USB only; no 220 V mains."], ["Telegram Bot API and FreeRTOS", "Telegram bot link and the software base of the project."]]
        }
      },
      "smartsprout": {
        title: "SmartSprout: smart watering on ESP32",
        desc: "A compact automatic watering system on ESP32: it measures soil moisture, turns on the pump by itself and is controlled from a smartphone through a web interface.",
        story: {
          problem: "House plants often die because of people: we forget to water them on time or overwater them, especially when going on holiday.",
          solution: "We built a compact automatic smart watering system on the ESP32 microcontroller. The device measures soil moisture with a sensor, turns on the pump when needed and lets you check every setting remotely through a web interface on a smartphone.",
          result: "An autonomous, affordable system that looks after a plant without human help.",
          steps: [["Measuring", "The sensor measures soil moisture."], ["Watering", "The device turns on the pump when needed."], ["Control", "Settings can be viewed and changed from a smartphone through the web interface."]],
          parts: [["ESP32", "Microcontroller."], ["Soil moisture sensor", "Measures moisture."], ["Relay and mini pump", "The relay turns on the pump that waters the plant."], ["Wi-Fi", "The web interface opens at http://192.168.4.1/."], ["Wooden case", "The device's case."]],
          team: [["Базарбаев Урмат, Таштанбеков Имангали, Уланбекова Жибек", "Circuit design, case assembly, ESP32 programming and interface setup."]]
        }
      },
      "climateguard": {
        title: "Climate under control (ClimateGuard)",
        desc: "An Arduino device with a DHT11 sensor: it watches temperature and humidity and lights an LED and sounds a buzzer when they go out of range.",
        story: {
          problem: "Room climate gets worse unnoticed: damp leads to mould, and dry or stuffy air harms health, and people notice too late.",
          solution: "We made an Arduino device. A DHT11 sensor measures temperature and humidity around the clock, and if they go out of range (20–24 °C and 40–60%), an LED and a buzzer turn on.",
          result: "A working prototype. It watches the climate by itself and warns about a problem right away, and it can be built from cheap parts without soldering.",
          steps: [["Measuring", "The DHT11 sensor measures temperature and humidity around the clock."], ["Normal range", "Allowed values: 20–24 °C and 40–60% humidity."], ["Warning", "If the values go out of range, the LED and buzzer turn on."]],
          parts: [["Arduino Uno", "Microcontroller."], ["DHT11", "Temperature and humidity sensor."], ["LED and buzzer", "Warn when values go out of range."], ["Breadboard", "Assembly without soldering."], ["Arduino IDE and C++", "Development environment and language."]],
          team: [["Жолдошбаева Нуриза, analyst", "Presentation."], ["Иванова Алина, lead engineer", "Circuit assembly, program."], ["Зарлыков Темирлан, tester", "Research."]],
          next: [["Telegram and Wi-Fi", "Telegram notifications over Wi-Fi."], ["Screen and history", "A screen and a history of readings."], ["DHT22 sensor", "A more accurate sensor instead of DHT11."], ["Humidifier", "Turn a humidifier on automatically."]]
        }
      },
      "glove-mouse": {
        title: "Wireless glove mouse",
        desc: "A glove with a motion sensor on ESP32-C3: it moves the cursor over Bluetooth without a desk or any surface.",
        story: {
          problem: "Classic mice tie the user to a surface or a desk.",
          solution: "We removed the need for a hard surface: the cursor is controlled by the hand wearing the device.",
          result: "We made a prototype for natural cursor control: sensor data is sent to the computer over Bluetooth.",
          steps: [["Reading the sensor", "The microcontroller polls the motion sensor quickly over the I2C bus."], ["Calibration and filtering", "The zero point is calibrated and signals are smoothed in software so the cursor moves smoothly."], ["Bluetooth HID", "The system sees the device as an ordinary wireless mouse; no drivers needed."]],
          parts: [["ESP32-C3 Super Mini", "Microcontroller."], ["MPU-6050", "Motion sensor."], ["Arduino IDE", "The environment the program is written in."]],
          team: [["Аннаоразов Богдан, assembler", "Assembled the project, worked on its look and comfort."], ["Женишбеков Нурсултан, prototyper", "Theory groundwork and the first code, parts list, pinout."], ["Рахманбердиев Алинур, calibration and programming", "Uploads the code, calibrates the device, ensures compatibility, tests."]],
          next: [["Calibration", "Improve calibration."], ["Wires", "Get rid of protruding wires."], ["Sleep mode", "Add a sleep mode."], ["Scroll wheel", "Add scroll-wheel support."], ["Battery", "Add a lithium battery and a TP4056 protection board."]]
        }
      },
      "kamkor": {
        title: "Kamkor: a fall detector without a camera",
        desc: "A wall-mounted sensor notices when a person falls, without a camera, and alerts relatives in Telegram. The name comes from the Kyrgyz word \"kamkorduk\" — care.",
        story: {
          problem: "An elderly person can fall at home when nobody is around. Cameras in a bedroom or bathroom invade privacy, and nobody wants them there.",
          solution: "A 60 GHz radar sees a person's chest drop sharply towards the floor, and an 8×8 thermal camera confirms the warm spot moved down. The device beeps and asks \"Are you okay?\". If there is no answer within 15 seconds, the alarm goes to relatives in Telegram.",
          result: "The prototype is built and tested in the Wokwi simulator. Two versions are costed: \"Kamkor Lite\" without the thermal camera for $99 and the full \"Kamkor\" with radar and thermal camera for $129.",
          steps: [["Watching", "The 60 GHz radar tracks the person's position in the room without a camera."], ["Confirmation", "The 8×8 thermal camera checks that the warm spot moved down and filters out false alarms."], ["Question", "The device beeps and asks \"Are you okay?\"."], ["Alarm", "No answer for 15 seconds — a notification goes to relatives in Telegram."]],
          parts: [["60 GHz radar", "Notices a person's sharp movement towards the floor."], ["8×8 thermal camera", "Confirms the fall, reduces false alarms."], ["3D-printed case", "Wall-mounted case."], ["Telegram bot", "Sends the alarm to relatives."]],
          team: [["Мадрахимов Авазбек, MiR(b)-1-26", "Idea, circuit, Wokwi prototype, product passport."]]
        }
      },
      "sunflower": {
        title: "\"Sunflower\": a light-following robot",
        desc: "A robot on Arduino Nano turns towards light using a PI controller, and \"hides\" when a hand reaches for it.",
        story: {
          problem: "VRII mini-project, module 1: show the Sense–Think–Act cycle and closed-loop control on a real device.",
          solution: "Two photoresistors separated by a shade measure which side is brighter. Based on the difference, the Arduino Nano uses a PI controller to turn a servo towards the light. An ultrasonic sensor notices a hand closer than 10 cm, and the robot \"hides\".",
          result: "It demonstrates calibration and a moving average, PWM servo control, a PI controller with overshoot plots for different Kp and Ki, and a state machine. Budget about 1,050 som.",
          steps: [["Calibration", "The robot remembers the light level on both photoresistors."], ["Search", "It turns until it finds the brightest light source."], ["Tracking", "The PI controller keeps the robot's \"face\" pointed at the light."], ["\"Hiding\"", "If a hand is closer than 10 cm, the robot turns away."]],
          parts: [["Arduino Nano", "Microcontroller running all the logic."], ["Two photoresistors and a shade", "Compare the light on the left and the right."], ["Servo", "Turns the robot's head, PWM control."], ["Ultrasonic sensor", "Notices a hand closer than 10 cm."]],
          team: [["Кудайназаров Айдар, MiR(b)-1-26", "Circuit, firmware, controller calculations."]]
        }
      },
      "smartflow": {
        title: "SmartFlow AI: smart traffic lights for Bishkek",
        desc: "An idea: traffic lights that adjust their phase lengths to the real load of the intersection, so cars spend less time in traffic jams."
      }
    }
  },

  ky: {
    roles: { engineer: "Инженер", tester: "Тестировщик", docs: "Документация жана эсеп", pr: "PR жана адамдар менен иш" },
    groups: {
      "mir-1": "Эки отряддагы алты команда: инженерлер, тестировщиктер, документация жана PR.",
      "mir-2": "МиР(б)-2-26 тобунун студенттери: долбоорлор, жетишкендиктер жана курам.",
      "mir-3": "МиР(б)-3-26 тобунун студенттери: долбоорлор, жетишкендиктер жана курам."
    },
    squads: { "Отряд А": "А отряды", "Отряд В": "В отряды", "Состав группы": "Топтун курамы" },
    tags: {
      "Макетирование": "Макет жасоо", "Гироскоп": "Гироскоп", "3D-печать": "3D-басып чыгаруу", "Датчик влажности": "Нымдуулук сенсору",
      "Реле": "Реле", "Мини-помпа": "Мини-насос", "Радар 60 ГГц": "60 ГГц радар", "Тепловизор 8×8": "8×8 жылуулук камерасы",
      "ПИ-регулятор": "ПИ-жөнгөлтүүчү", "Фоторезисторы": "Фоторезисторлор", "Сервопривод": "Сервопривод", "Конечный автомат": "Чектүү автомат",
      "ИИ": "ЖИ", "Компьютерное зрение": "Компьютердик көрүү", "Умный город": "Акылдуу шаар"
    },
    ach: [
      { date: "Эл аралык космостук оюндар, Москва", title: "Мыкты медиа адистер",
        text: "Биздин команда Н. Э. Бауман атындагы ММТУнун аянтчасында өткөн Эл аралык космостук оюндарда медиа номинациясында мыкты деп табылды. Бул тууралуу «Кабар» агенттиги жазды." }
    ],
    kabar: {
      title: "Кыргыз студенттери Космостук оюндарда мыкты медиа адистер болушту",
      text: "Эл аралык космостук оюндар Москвада Н. Э. Бауман атындагы ММТУнун аянтчасында өттү. Биздин ийгилигибиз тууралуу «Кабар» Кыргыз улуттук маалымат агенттиги жазды."
    },
    gallery: ["Эл аралык космостук оюндар", "Оюндардын аянтчасында", "Кызыл аянт, Москва"],
    items: {
      "smart-garage": {
        title: "Arduino'догу акылдуу гараж", author: "МИР-1 командасы",
        desc: "Машина 20 смден жакын келгенде өзү көтөрүлүп, 3 секунддан кийин жабылган дарбазанын макети.",
        story: {
          problem: "Дарбазаны кол менен ачуу үчүн айдоочу машинадан түшүшү же кулпуга алаксышы керек. Бул ыңгайсыз жана убакытты алат.",
          solution: "Биз дарбазанын автономдуу макетин жасадык. HC-SR04 ультраүн аралык өлчөгүчү машинага чейинки аралыкты өлчөйт, ал эми SG90 сервоприводу машина 20 смден жакын келгенде дарбазаны көтөрүп, 3 секунддан кийин жабат.",
          result: "Иштеген физикалык прототип. Сенсор 0,1 секундда жооп берет, бардык сыноолордо дарбаза ачылып-жабылды.",
          steps: [["Күтүү", "Дарбаза жабык (0°), сенсор аралыкты тынымсыз өлчөйт."], ["Аныктоо", "Объект 20 смден жакын табылды."], ["Ачылуу", "Сервопривод 90° бурулат, 3 секунд тыныгуу."], ["Жабылуу", "Дарбаза баштапкы абалына (0°) кайтат."]],
          parts: [["Arduino Uno", "Микроконтроллер, долбоордун бардык логикасы."], ["HC-SR04", "Аралыкты тийбей өлчөөчү ультраүн сенсору."], ["SG90 сервоприводу", "Дарбазаны көтөрүп-түшүргөн мотор."], ["Туташтыруу", "5V/GND азык, сервопривод D3 пинде (ШИМ), сенсор Trig/Echo D9 жана D10 пиндеринде."]],
          team: [["Иштеп чыгуучу жана схемотехник", "Схеманы чогултуу, жабдууну жөндөө, макетти куруу."], ["Программист", "Arduino IDE'де C++ скетчи, аралык боюнча алгоритм."]],
          next: [["RFID аркылуу кирүү", "RC522 модулу: дарбаза ээсинин картасы же брелогу менен гана ачылат."], ["Эки факторлуу коргоо", "Машина дарбазанын жанында болуп, карта текшерүүдөн өткөндө гана ачылат."], ["LDR сенсору менен жарык", "Караңгы болгондо гараждагы жарык өзү күйөт."], ["Смартфондон башкаруу", "Bluetooth HC-05 же Wi-Fi: дарбазаны телефондон ачуу же жабуу."], ["ИК-тосмо", "Ачыкта тоскоол болсо, дарбаза токтойт."]]
        }
      },
      "esp32-mini-radar": {
        title: "ESP32'деги мини-радар",
        desc: "ESP32'деги мини-радар: сервоприводдогу ультраүн сенсору мейкиндикти сканерлеп, объекттерге чейинки аралыкты өлчөйт жана жакындаганда үн белгиси менен эскертет.",
        story: {
          result: "Мини-радардын иштеген прототиби түзүлдү: ал объекттерди табат, аларга чейинки аралыкты өлчөйт жана жакындаганда үн менен эскертет.",
          parts: [["ESP32", "Микроконтроллер."], ["HC-SR04", "Ультраүн аралык сенсору."], ["SG92R сервоприводу", "Сканерлөө үчүн сенсорду бурат."], ["TMB12A05 зуммери", "Үн белгиси."], ["Arduino IDE жана C++", "Программалоо чөйрөсү жана тили."], ["Макет плата", "Түзмөктү электрондук бөлүктөрдөн чогултуу."], ["3D-басып чыгаруу", "Корпус жасоо пландалууда."]],
          team: [["Шаршенбеков Дамир, МИР-1-26", "Долбоорду иштеп чыгуу, схеманы чогултуу, бөлүктөрдү туташтыруу, ESP32'ни программалоо, сыноо жана жөндөө."]]
        }
      },
      "digisand": {
        title: "DigiSand: кум саат",
        desc: "Гироскоптуу Arduino Nano'догу электрондук кум саат: түзмөк кумдун агышын симуляциялайт.",
        story: {
          solution: "Биз долбоорду Arduino негизинде жасадык, ал гироскоптун жардамы менен иштейт.",
          result: "Кумдун толук симуляциясын жасай алдык.",
          parts: [["Arduino Nano", "Микроконтроллер."], ["Гироскоп", "Түзмөк иштеген сенсор."], ["Wokwi", "Электрониканын онлайн-симулятору."], ["3D-басып чыгаруу", "Корпус жасоо."]],
          next: [["Реалдуу убакыт таймери", "Азырынча долбоордо реалдуу убакыт таймери жетишпейт."]]
        }
      },
      "starys": {
        title: "STARYS: Марс үчүн куруучу модулдардын тобу",
        desc: "Марста базаны даярдоо үчүн ESP32'деги бирдей куб-модулдардын тобу: алар бири-бирин өздөрү таап, кошулуп, бир бөлүштүрүлгөн компьютер катары иштешет.",
        story: {
          problem: "Марста азырынча адамдар жок, ал эми базаны алдын ала даярдоо керек. Курулушту Жерден башкарууга болбойт: сигнал ал жакка 22 мүнөткө чейин барат.",
          solution: "Биз ESP32'де 80 мм бирдей куб-модулдарды долбоорлодук. Алар бири-бирин өздөрү табышат, которулуучу магниттер менен кошулушат жана кыры аркылуу энергия менен маалыматты зымсыз беришет. Кубдар ички маховик менен тоголонот, аларга алмашуучу шаймандар бекитилет: гусеницалар, кол, чөмүч, күн панели.",
          result: "Программа 8 000ге жакын автоматтык текшерүүдөн катасыз өтөт. MuJoCo симуляциясында v0.3 модулуна Марста кошунасына чыгуу үчүн маховиктин 7 710 айл/мүн жетиштүү (чеги 12 000). Лидер «бузулганда» топ 0,5–0,8 секундда жаңысын шайлайт. Модуль 397 г тартат, ГОСТ ЕСКД боюнча чиймелердин топтому бар. Прототип темирде азырынча сыналган эмес.",
          steps: [["Издөө", "Бирдей модулдар бири-бирин өздөрү табышат."], ["Кошулуу", "Которулуучу магниттер модулдарды бириктирет, кыры аркылуу энергия жана маалымат зымсыз берилет."], ["Лидер", "Кошулган модулдар бир бөлүштүрүлгөн компьютер катары иштешет: лидер шайлап, тапшырмаларды бөлүшөт."], ["Сактоо", "Маалымат үч нускада сакталат."]],
          parts: [["ESP32'деги 80 мм куб-модуль", "Топ түзүлгөн бирдей модулдар."], ["Которулуучу магниттер", "Модулдарды бири-бирине бириктирет."], ["Ички маховик", "Кубдун тоголонушуна мүмкүндүк берет."], ["Алмашуучу шаймандар", "Гусеницалар, кол, чөмүч, күн панели."]],
          team: [["Джоробеков Эрназар, жетектөөчү инженер", "Программа, эсептөөлөр, 3D-модель."], ["Турдушова Амина, «Спикер»", "Долбоорду коргоо, демо, видео."], ["Майрамбекова Таңшоола, «Сыноочу чебер»", "3D-басып чыгаруу, чогултуу, өлчөөлөр жана сыноолор."]]
        }
      },
      "esp32-rc-car": {
        title: "ESP32'деги радио башкаруучу машина",
        desc: "Эки ESP32 платасындагы машина жана джойстик-пульт радио аркылуу түз байланышат (ESP-NOW): телефонсуз жана роутерсиз.",
        story: {
          problem: "Кадимки өзү жасалган машиналар Bluetooth же Wi-Fi аркылуу башкарылат, аларга телефон же роутер керек, байланыш кечигиши мүмкүн.",
          solution: "Биз радио аркылуу түз байланышкан эки ESP32 платасында машина жана джойстик-пульт чогулттук (ESP-NOW протоколу). Пульт джойстиктин абалын окуп, буйрук жөнөтөт, машина аны кабыл алып, L298N драйвери аркылуу төрт моторду башкарат.",
          result: "Машина роутерсиз жана телефонсуз башкарылат: имаратта 10–15 мге чейин, ачык жерде 100 мге чейин, жооп 5 мсден аз.",
          steps: [["Джойстик", "Пульт джойстиктин абалын окуйт."], ["Буйрук", "Пульт буйрукту радио аркылуу жөнөтөт (ESP-NOW)."], ["Кабыл алуу", "Машинадагы ESP32 платасы буйрукту кабыл алат."], ["Кыймыл", "L298N драйвери аркылуу төрт мотор башкарылат."]],
          parts: [["ESP32 (эки плата)", "Бири джойстик-пультта, экинчиси машинада."], ["ESP-NOW", "Платалар ортосундагы түз радио байланыш протоколу."], ["L298N драйвери", "Машинанын төрт моторун башкарат."], ["18650 аккумуляторлору", "Азык."], ["Arduino IDE жана C++", "Программалоо чөйрөсү жана тили."]],
          team: [["Саитов Атай", "МИР(б)-3-26"], ["Ашырбеков Хантейиш", "МИР(б)-3-26"]]
        }
      },
      "acousticguard": {
        title: "AcousticGuard: ESP32'деги ызы-чуу детектору",
        desc: "Сигналды тегиздөөчү, экранда шкаласы жана жарык эскертүүсү бар ESP32'деги ызы-чуу детектору. Ызы-чуу 50%дан ашканда Telegram'га билдирүү жөнөтөт.",
        story: {
          problem: "Арзан микрофон модулунун сезгичтиги төмөн жана программалык чыпкасыз туруксуз сигнал берет.",
          solution: "Биз импульстарды тегиздөөчү, экранга шкала чыгаруучу жана жарык эскертүүсү бар ESP32'деги ызы-чуу детекторун чогулттук. Ызы-чуу 50%дан ашканда түзмөк Wi-Fi аркылуу Telegram'га билдирүү жөнөтөт.",
          result: "40 мс жооп берген жана спамдан корголгон (мүнөтүнө 1 билдирүү) иштеген прототип.",
          steps: [["Чыпкалоо", "Микрофондун сигналы тегизделет: импульстар программалык түрдө чыпкаланат."], ["Көрсөтүү", "Ызы-чуунун деңгээли экранда шкала менен көрсөтүлөт, жарык эскертүүсү бар."], ["Билдирүү", "Ызы-чуу 50%дан ашканда түзмөк Wi-Fi аркылуу Telegram'га билдирүү жөнөтөт."], ["Спамдан коргоо", "Мүнөтүнө бирден ашык билдирүү жок."]],
          parts: [["ESP32", "Микроконтроллер."], ["KY-037", "Микрофон модулу."], ["OLED SSD1306", "Ызы-чуу деңгээлинин шкаласы бар экран."], ["Telegram Bot API", "Telegram'га билдирүү жөнөтүү."], ["Arduino C++", "Программалоо тили."]],
          team: [["Андрей", "МиР-3-26"], ["Раатбек", "МиР-3-26"]]
        }
      },
      "auto-trash-bin": {
        title: "Авто таштанды челек",
        desc: "Жакын келгенде өзү ачылган Arduino Nano'догу таштанды челек.",
        story: {
          problem: "Педалдуу таштанды челекти колдонуу ыңгайсыз.",
          solution: "Биз автоматтык таштанды челек жасадык.",
          result: "Жакын келсең, челек өзү ачылат.",
          parts: [["Arduino Nano", "Микроконтроллер."]]
        }
      },
      "pixie": {
        title: "Пикси: ESP32'деги акылдуу шам",
        desc: "ESP32'деги акылдуу шам: караңгыда жанында адам болгондо күйөт, эч ким жок болсо өзү өчөт.",
        story: {
          problem: "Кадимки жарык бөлмөдө эч ким жок болгондо да электр энергиясын коротот.",
          solution: "Биз ESP32 негизинде акылдуу шам жасадык: ал караңгыда адамды байкаганда күйөт жана белгиленген убакыт ичинде кыймыл же катышуу байкалбаса, автоматтык түрдө өчөт.",
          result: "Автоматтык башкаруусу жана 3D-принтерде жасалган корпусу бар акылдуу шамдын иштеген прототиби түзүлдү.",
          steps: [["Күйүү", "Караңгыда адам байкалганда шам күйөт."], ["Өчүү", "Белгиленген убакыт ичинде кыймыл же катышуу байкалбаса, шам өзү өчөт."]],
          parts: [["ESP32 DevKit", "Микроконтроллер."], ["HLK-LD2410C", "Адамды байкаган сенсор."], ["WS2812", "Шамдын светодиоддору."], ["5 В азык булагы", "Азык."], ["3D-басып чыгаруу", "Корпус 3D-принтерде жасалган."]]
        }
      },
      "cyberbuddy": {
        title: "CyberBuddy: столдогу робот-шерик",
        desc: "ESP32'деги столдогу робот: адамды байкап, жарыкты күйгүзөт, температураны көзөмөлдөйт, экрандагы жүзү менен маанайын көрсөтөт жана Telegram'га жазат.",
        story: {
          problem: "Столдогу түзмөктөр айланасында эмне болуп жатканына жооп бербейт. Жарык жана желдеткич тынымсыз иштейт же кол менен күйгүзүлөт, ысып кеткенин эч ким убагында билбейт.",
          solution: "Биз ESP32 негизинде столдогу робот-шерик жасадык. Ал столдо адамды байкап, жарыкты күйгүзөт, температураны өлчөйт жана ысып кеткенде (28 °Cден жогору) желдеткичти күйгүзөт. Абалын OLED-экрандагы жүзү менен көрсөтөт: уйку, кубаныч же тынчсыздануу. @CyberBuddy_bot Telegram-боту аркылуу билдирүүлөрдү жөнөтөт жана /start, /stop, /status, /alert буйруктарына жооп берет.",
          result: "Автоматтык башкаруусу бар иштеген прототип. Үч абалдуу чектүү автомат (IDLE, ACTIVE, ALERT) кыймыл жана температура боюнча режимдерди алмаштырат. Жүк USB'ден, 5 В менен гана иштейт, 220 В тармак колдонулбайт.",
          steps: [["Столдо адам", "Робот адамды байкап, жарыкты күйгүзөт."], ["Ысып кетүү", "Температура 28 °Cден жогору болсо, желдеткич күйөт."], ["Экрандагы жүз", "Робот OLED-экранда абалын көрсөтөт: уйку, кубаныч же тынчсыздануу."], ["Абалдар", "Үч абалдуу чектүү автомат (IDLE, ACTIVE, ALERT) кыймыл жана температура боюнча режимдерди алмаштырат."], ["Telegram", "@CyberBuddy_bot боту билдирүүлөрдү жөнөтөт жана /start, /stop, /status, /alert буйруктарына жооп берет."]],
          parts: [["Expansion Shield менен ESP32 DevKit v1", "Микроконтроллер."], ["PIR HC-SR501", "Кыймыл сенсору."], ["DHT11", "Температура жана нымдуулук сенсору."], ["OLED SSD1306 0,96″ (I2C)", "Роботтун жүзү көрсөтүлгөн экран."], ["Реле модулдары", "Жарыкты жана желдеткичти күйгүзөт."], ["USB азык, 5 В", "Жүк USB'ден гана иштейт, 220 В тармак колдонулбайт."], ["Telegram Bot API жана FreeRTOS", "Telegram-бот менен байланыш жана долбоордун программалык негизи."]]
        }
      },
      "smartsprout": {
        title: "SmartSprout: ESP32'деги акылдуу сугаруу",
        desc: "ESP32'деги компакттуу автосугаруу системасы: топурактын нымдуулугун өлчөйт, насосту өзү күйгүзөт жана смартфондон веб-интерфейс аркылуу башкарылат.",
        story: {
          problem: "Үй өсүмдүктөрү көбүнчө адамдын айынан өлөт: аларды убагында сугарууну унутабыз же тескерисинче, өтө көп сугарабыз, айрыкча эс алууга кеткенде.",
          solution: "Биз ESP32 микроконтроллеринин негизинде компакттуу автоматтык акылдуу сугаруу системасын жасадык. Түзмөк сенсор аркылуу топурактын нымдуулугун өзү өлчөйт, керек болгондо насосту күйгүзөт жана бардык параметрлерди смартфондон веб-интерфейс аркылуу алыстан көзөмөлдөөгө мүмкүндүк берет.",
          result: "Өсүмдүккө адамдын катышуусуз кам көргөн автономдуу жана жеткиликтүү система болуп чыкты.",
          steps: [["Өлчөө", "Сенсор топурактын нымдуулугун өлчөйт."], ["Сугаруу", "Керек болгондо түзмөк насосту күйгүзөт."], ["Көзөмөл", "Параметрлерди смартфондон веб-интерфейс аркылуу көрүп, өзгөртсө болот."]],
          parts: [["ESP32", "Микроконтроллер."], ["Топурак нымдуулугунун сенсору", "Нымдуулукту өлчөйт."], ["Реле жана мини-насос", "Реле өсүмдүктү сугарган насосту күйгүзөт."], ["Wi-Fi", "Веб-интерфейс http://192.168.4.1/ дареги боюнча ачылат."], ["Жыгач корпус", "Түзмөктүн корпусу."]],
          team: [["Базарбаев Урмат, Таштанбеков Имангали, Уланбекова Жибек", "Схеманы иштеп чыгуу, корпусту чогултуу, ESP32'ни программалоо жана интерфейсти жөндөө."]]
        }
      },
      "climateguard": {
        title: "Климат көзөмөлдө (ClimateGuard)",
        desc: "DHT11 сенсору бар Arduino'догу түзмөк: температура менен нымдуулукту көзөмөлдөп, алар нормадан чыкканда светодиод менен зуммерди күйгүзөт.",
        story: {
          problem: "Бөлмөдөгү климат байкалбай бузулат: нымдан көгөрүү пайда болот, кургак аба жана дем кысылуу ден соолукка зыян, адам муну өтө кеч байкайт.",
          solution: "Биз Arduino'до түзмөк жасадык. DHT11 сенсору температура менен нымдуулукту күнү-түнү өлчөйт, алар нормадан чыкса (20–24 °C жана 40–60 %), светодиод менен зуммер күйөт.",
          result: "Иштеген прототип. Ал климатты өзү көзөмөлдөйт жана көйгөй тууралуу дароо эскертет, аны арзан бөлүктөрдөн ширетүүсүз чогултса болот.",
          steps: [["Өлчөө", "DHT11 сенсору температура менен нымдуулукту күнү-түнү өлчөйт."], ["Норма", "Уруксат берилген маанилер: 20–24 °C жана нымдуулук 40–60 %."], ["Эскертүү", "Маанилер нормадан чыкса, светодиод менен зуммер күйөт."]],
          parts: [["Arduino Uno", "Микроконтроллер."], ["DHT11", "Температура жана нымдуулук сенсору."], ["Светодиод жана зуммер", "Нормадан чыкканда эскертет."], ["Макет плата", "Ширетүүсүз чогултуу."], ["Arduino IDE жана C++", "Программалоо чөйрөсү жана тили."]],
          team: [["Жолдошбаева Нуриза, аналитик", "Презентация."], ["Иванова Алина, жетектөөчү инженер", "Схеманы чогултуу, программа."], ["Зарлыков Темирлан, сыноочу", "Изилдөө."]],
          next: [["Telegram жана Wi-Fi", "Wi-Fi аркылуу Telegram'га билдирүүлөр."], ["Экран жана тарых", "Экран жана көрсөткүчтөрдүн тарыхы."], ["DHT22 сенсору", "DHT11дин ордуна тагыраак сенсор."], ["Нымдагыч", "Нымдагычты автоматтык түрдө күйгүзүү."]]
        }
      },
      "glove-mouse": {
        title: "Зымсыз мээлей-чычкан",
        desc: "ESP32-C3'төгү кыймыл сенсору бар мээлей: курсорду Bluetooth аркылуу столсуз жана беттиксиз башкарат.",
        story: {
          problem: "Классикалык чычкандар колдонуучуну бетке же столго катуу байлап коет.",
          solution: "Биз катуу беттен көз карандылыкты алып салдык: курсорду түзмөк кийилген кол башкарат.",
          result: "Курсорду табигый башкаруу үчүн прототип жасадык: сенсорлордун маалыматтары түзмөккө Bluetooth аркылуу берилет.",
          steps: [["Сенсорду суроо", "Микроконтроллер кыймыл сенсорун I2C шинасы аркылуу тез сурайт."], ["Калибровка жана чыпкалоо", "Курсор жылмакай жылышы үчүн нөл чекити программалык түрдө калибрленет жана сигналдар тегизделет."], ["Bluetooth HID", "Система түзмөктү кадимки зымсыз чычкан катары таанып алат, драйвер керек эмес."]],
          parts: [["ESP32-C3 Super Mini", "Микроконтроллер."], ["MPU-6050", "Кыймыл сенсору."], ["Arduino IDE", "Программа жазылган чөйрө."]],
          team: [["Аннаоразов Богдан, чогултуучу", "Долбоорду чогултту, сырткы көрүнүшү жана ыңгайлуулугу менен иштеди."], ["Женишбеков Нурсултан, макетчи", "Теориялык даярдык жана алгачкы код, керектүү бөлүктөрдүн тизмеси, пиндердин жайгашуусу."], ["Рахманбердиев Алинур, калибровкачы жана программист", "Кодду жүктөйт, түзмөктү калибрлейт, шайкештикти камсыз кылат, сынайт."]],
          next: [["Калибровка", "Калибровканы жакшыртуу."], ["Зымдар", "Чыгып турган зымдардан арылуу."], ["Уйку режими", "Уйку режимин кошуу."], ["Дөңгөлөкчө", "Чычкандын дөңгөлөкчөсүн колдонуу мүмкүнчүлүгүн кошуу."], ["Автономдуулук", "Литий аккумулятору жана TP4056 азык коргоо платасын кошуу."]]
        }
      },
      "kamkor": {
        title: "Камкор: камерасыз жыгылуу сенсору",
        desc: "Дубалга илинген сенсор адамдын жыгылганын камерасыз байкап, жакындарына Telegram аркылуу кабарлайт. Аталышы «камкордук» деген сөздөн.",
        story: {
          problem: "Кары адам үйдө жанында эч ким жокто жыгылып калышы мүмкүн. Уктоочу бөлмөдөгү же ваннадагы камералар купуялуулукту бузат, аларды ал жакка эч ким койгусу келбейт.",
          solution: "60 ГГц радар адамдын көкүрөгү кескин полго түшкөнүн көрөт, ал эми 8×8 жылуулук камерасы жылуу так ылдый түшкөнүн ырастайт. Түзмөк чыйылдап, «Сиз жакшысызбы?» деп сурайт. 15 секунд ичинде жооп болбосо, эскертүү туугандарына Telegram'га кетет.",
          result: "Прототип чогултулуп, Wokwi симуляторунда текшерилди. Эки версия эсептелди: жылуулук камерасыз «Камкор Лайт» $99 жана радар менен жылуулук камерасы бар толук «Камкор» $129.",
          steps: [["Байкоо", "60 ГГц радар бөлмөдөгү адамдын абалын камерасыз көзөмөлдөйт."], ["Ырастоо", "8×8 жылуулук камерасы жылуу так ылдый түшкөнүн текшерип, жалган эскертүүлөрдү четтетет."], ["Суроо", "Түзмөк чыйылдап, «Сиз жакшысызбы?» деп сурайт."], ["Эскертүү", "15 секунд жооп жок — билдирүү жакындарына Telegram'га кетет."]],
          parts: [["60 ГГц радар", "Адамдын полго кескин кыймылын байкайт."], ["8×8 жылуулук камерасы", "Жыгылууну ырастайт, жалган эскертүүлөрдү азайтат."], ["3D-басылган корпус", "Түзмөктүн дубалдагы корпусу."], ["Telegram-бот", "Эскертүүнү туугандарына жөнөтөт."]],
          team: [["Мадрахимов Авазбек, МиР(б)-1-26", "Идея, схема, Wokwi'деги прототип, продукт паспорту."]]
        }
      },
      "sunflower": {
        title: "«Күн карама»: жарыкты ээрчиген робот",
        desc: "Arduino Nano'догу робот ПИ-жөнгөлтүүчүнүн жардамы менен жарыкты көздөй бурулат, ал эми ага кол сунулганда «жашынат».",
        story: {
          problem: "ВРИИ мини-долбоору, 1-модуль: Sense–Think–Act циклин жана туюк башкарууну жандуу түзмөктө көрсөтүү керек.",
          solution: "Тосмо менен бөлүнгөн эки фоторезистор кайсы тарапта жарык күчтүү экенин өлчөйт. Arduino Nano жарыктын айырмасы боюнча ПИ-жөнгөлтүүчү менен сервоприводду жарык булагын көздөй бурат. Ультраүн сенсору 10 смден жакын колду байкаса, робот «жашынат».",
          result: "Калибровканы жана жылма орточону, сервону ШИМ менен башкарууну, ар кандай Kp жана Ki үчүн ашыкча жөнгөлтүү графиктери бар ПИ-жөнгөлтүүчүнү жана чектүү автоматты көрсөтөт. Бюджети 1050 сомго жакын.",
          steps: [["Калибровка", "Робот эки фоторезистордун жарыктыгын эстеп калат."], ["Издөө", "Эң жарык булакты тапканга чейин бурулат."], ["Ээрчүү", "ПИ-жөнгөлтүүчү роботтун «жүзүн» жарыкка буруп турат."], ["«Жашынуу»", "Кол 10 смден жакын болсо, робот бурулуп кетет."]],
          parts: [["Arduino Nano", "Микроконтроллер, бардык логика."], ["Эки фоторезистор жана тосмо", "Сол жана оң тараптагы жарыкты салыштырат."], ["Сервопривод", "Роботтун башын бурат, ШИМ менен башкаруу."], ["Ультраүн сенсору", "10 смден жакын колду байкайт."]],
          team: [["Кудайназаров Айдар, МиР(б)-1-26", "Схема, программа, жөнгөлтүүчүнү эсептөө."]]
        }
      },
      "smartflow": {
        title: "SmartFlow AI: Бишкек үчүн акылдуу светофорлор",
        desc: "Идея: жол кайчылышынын чыныгы жүгүнө жараша фазалардын узактыгын өзгөрткөн светофорлор, машиналар тыгындарда азыраак турушу үчүн."
      }
    }
  }
};
