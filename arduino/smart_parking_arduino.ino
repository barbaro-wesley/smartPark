#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>
#include <LiquidCrystal.h>

// RFID
#define PINO_SS 10
#define PINO_RST 9

MFRC522 rfid(PINO_SS, PINO_RST);

// LCD: RS, E, D4, D5, D6, D7
LiquidCrystal lcd(8, A0, A1, A3, A4, A5);

// Servo
Servo catraca;

const int PINO_SERVO = A2;
const int ANGULO_FECHADO = 10;
const int ANGULO_ABERTO = 100;

const unsigned long TEMPO_ABERTA = 5000;

// Vagas
const int TOTAL_VAGAS = 2;

const int pinosTrig[TOTAL_VAGAS] = {
  2, 4
};

const int pinosEcho[TOTAL_VAGAS] = {
  3, 5
};

const int pinosLed[TOTAL_VAGAS] = {
  6, 7
};

bool vagasOcupadas[TOTAL_VAGAS] = {
  false, false
};

const float DISTANCIA_OCUPADA = 15.0;

// Cartões dentro do estacionamento
String cartoesEstacionados[TOTAL_VAGAS];
int quantidadeCartoes = 0;

String ultimoCartao = "";
unsigned long tempoUltimoCartao = 0;

const unsigned long TEMPO_ENTRE_LEITURAS = 2500;

unsigned long ultimaAtualizacaoLCD = 0;


void setup() {
  Serial.begin(9600);

  for (int i = 0; i < TOTAL_VAGAS; i++) {
    pinMode(pinosTrig[i], OUTPUT);
    pinMode(pinosEcho[i], INPUT);
    pinMode(pinosLed[i], OUTPUT);

    digitalWrite(pinosTrig[i], LOW);
    digitalWrite(pinosLed[i], LOW);
  }

  catraca.attach(PINO_SERVO);
  fecharCatraca();

  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("Estacionamento");
  lcd.setCursor(0, 1);
  lcd.print("Inteligente");

  delay(2000);

  SPI.begin();
  rfid.PCD_Init();

  lerVagas();
  atualizarLeds();
  atualizarLCD();

  Serial.println("Sistema iniciado");
}


void loop() {
  lerVagas();
  atualizarLeds();

  if (millis() - ultimaAtualizacaoLCD >= 800) {
    atualizarLCD();
    ultimaAtualizacaoLCD = millis();
  }

  verificarCartao();

  delay(80);
}


// Faz a leitura dos sensores
void lerVagas() {
  for (int i = 0; i < TOTAL_VAGAS; i++) {
    float distancia = medirDistancia(
      pinosTrig[i],
      pinosEcho[i]
    );

    vagasOcupadas[i] =
      distancia > 0 &&
      distancia <= DISTANCIA_OCUPADA;

    delay(50);
  }
}


// Mede a distância do HC-SR04
float medirDistancia(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);

  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  unsigned long duracao =
    pulseIn(echo, HIGH, 30000UL);

  if (duracao == 0) {
    return 999.0;
  }

  return duracao * 0.0343 / 2.0;
}


// Atualiza os LEDs
void atualizarLeds() {
  for (int i = 0; i < TOTAL_VAGAS; i++) {
    digitalWrite(
      pinosLed[i],
      vagasOcupadas[i] ? HIGH : LOW
    );
  }
}


// Conta as vagas livres
int contarVagasLivres() {
  int livres = 0;

  for (int i = 0; i < TOTAL_VAGAS; i++) {
    if (!vagasOcupadas[i]) {
      livres++;
    }
  }

  return livres;
}


// Mostra as vagas no LCD
void atualizarLCD() {
  int vagasLivres = contarVagasLivres();

  lcd.setCursor(0, 0);
  lcd.print("Vagas livres: ");
  lcd.print(vagasLivres);
  lcd.print(" ");

  lcd.setCursor(0, 1);

  if (vagasLivres == 0) {
    lcd.print("Estac. cheio   ");
  } else {
    lcd.print("Passe o cartao ");
  }
}


// Mostra uma mensagem no LCD
void mostrarMensagem(
  const char* linha1,
  const char* linha2
) {
  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print(linha1);

  lcd.setCursor(0, 1);
  lcd.print(linha2);
}


// Verifica se um cartão foi aproximado
void verificarCartao() {
  if (!rfid.PICC_IsNewCardPresent()) {
    return;
  }

  if (!rfid.PICC_ReadCardSerial()) {
    return;
  }

  String uid = lerUID();

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  if (uid.length() == 0) {
    return;
  }

  if (
    uid == ultimoCartao &&
    millis() - tempoUltimoCartao <
      TEMPO_ENTRE_LEITURAS
  ) {
    return;
  }

  ultimoCartao = uid;
  tempoUltimoCartao = millis();

  Serial.print("Cartao: ");
  Serial.println(uid);

  processarCartao(uid);
}


// Retorna o código do cartão
String lerUID() {
  String uid = "";

  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }

    uid += String(
      rfid.uid.uidByte[i],
      HEX
    );
  }

  uid.toUpperCase();

  return uid;
}


// Decide se o carro está entrando ou saindo
void processarCartao(String uid) {
  int posicao = procurarCartao(uid);

  if (posicao >= 0) {
    liberarSaida(uid, posicao);
  } else {
    tentarEntrada(uid);
  }
}


// Tenta liberar a entrada
void tentarEntrada(String uid) {
  lerVagas();
  atualizarLeds();

  int vagasLivres = contarVagasLivres();

  if (
    vagasLivres == 0 ||
    quantidadeCartoes >= TOTAL_VAGAS
  ) {
    negarEntrada();
    return;
  }

  salvarCartao(uid);

  Serial.println("Entrada liberada");

  mostrarMensagem(
    "Entrada liberada",
    "Catraca aberta"
  );

  abrirCatraca();

  atualizarLCD();
}


// Libera a saída
void liberarSaida(
  String uid,
  int posicao
) {
  Serial.println("Saida liberada");

  mostrarMensagem(
    "Saida liberada",
    "Catraca aberta"
  );

  abrirCatraca();

  removerCartao(posicao);

  atualizarLCD();
}


// Mostra que o estacionamento está cheio
void negarEntrada() {
  Serial.println("Entrada negada");

  mostrarMensagem(
    "Entrada negada",
    "Sem vagas"
  );

  delay(2000);

  atualizarLCD();
}


// Abre a catraca por 5 segundos
void abrirCatraca() {
  catraca.write(ANGULO_ABERTO);

  Serial.println("Catraca abriu");

  unsigned long inicio = millis();
  unsigned long ultimaAtualizacao = 0;

  while (millis() - inicio < TEMPO_ABERTA) {
    lerVagas();
    atualizarLeds();

    if (millis() - ultimaAtualizacao >= 1000) {
      int segundos =
        (TEMPO_ABERTA - (millis() - inicio)) / 1000;

      lcd.setCursor(0, 0);
      lcd.print("Catraca aberta ");

      lcd.setCursor(0, 1);
      lcd.print("Fecha em: ");
      lcd.print(segundos);
      lcd.print("s  ");

      ultimaAtualizacao = millis();
    }
  }

  fecharCatraca();

  mostrarMensagem(
    "Catraca fechada",
    "Aguarde..."
  );

  delay(1000);
}


// Fecha a catraca
void fecharCatraca() {
  catraca.write(ANGULO_FECHADO);
  delay(700);

  Serial.println("Catraca fechou");
}


// Procura o cartão na lista
int procurarCartao(String uid) {
  for (int i = 0; i < quantidadeCartoes; i++) {
    if (cartoesEstacionados[i] == uid) {
      return i;
    }
  }

  return -1;
}


// Salva o cartão
void salvarCartao(String uid) {
  if (quantidadeCartoes < TOTAL_VAGAS) {
    cartoesEstacionados[quantidadeCartoes] = uid;
    quantidadeCartoes++;
  }
}


// Remove o cartão
void removerCartao(int posicao) {
  if (
    posicao < 0 ||
    posicao >= quantidadeCartoes
  ) {
    return;
  }

  for (
    int i = posicao;
    i < quantidadeCartoes - 1;
    i++
  ) {
    cartoesEstacionados[i] =
      cartoesEstacionados[i + 1];
  }

  cartoesEstacionados[
    quantidadeCartoes - 1
  ] = "";

  quantidadeCartoes--;
}