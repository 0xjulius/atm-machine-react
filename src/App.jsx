// App.js
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import bGround from "./assets/bg.jpg";
import atmTexture from "./assets/atm-texture.png";
import logoHeader from "./assets/logo.png";

function App() {
  const [saldo, setSaldo] = useState(1000.0);
  const [currentScreen, setCurrentScreen] = useState("intro");
  const [inputValue, setInputValue] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customWithdraw, setCustomWithdraw] = useState(false);
  const [cardState, setCardState] = useState("out"); // out | inserting | in | ejecting
  const [shake, setShake] = useState(false);
  const [muted, setMuted] = useState(false);

  const ambientRef = useRef(null);
  const beepRef = useRef(null);
  const waitRef = useRef(null);

  const startMusic = () => {
    if (!ambientRef.current) {
      ambientRef.current = new Audio("/ambience.mp3");
      ambientRef.current.loop = true;
      ambientRef.current.volume = 0.4;
    }
    ambientRef.current
      .play()
      .then(() => {
        console.log("Ambience käynnistyi");
        setCurrentScreen("idle");
      })
      .catch((err) => console.log("Musiikin käynnistys epäonnistui:", err));

    if (!beepRef.current) {
      beepRef.current = new Audio("/beep.mp3");
    }
    if (!waitRef.current) {
      waitRef.current = new Audio("/wait.mp3");
    }
  };

  const playBeep = () => {
    if (beepRef.current) beepRef.current.play();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (ambientRef.current) ambientRef.current.muted = next;
    if (beepRef.current) beepRef.current.muted = next;
    if (waitRef.current) waitRef.current.muted = next;
  };

  const performActionWithLoad = (action) => {
    setLoading(true);
    if (waitRef.current) {
      waitRef.current.currentTime = 0; // Reset to start to avoid overlap
      waitRef.current
        .play()
        .catch((err) => console.log("Wait sound failed:", err));
    }
    setTimeout(() => {
      action();
      setLoading(false);
      if (waitRef.current) {
        waitRef.current.pause();
        waitRef.current.currentTime = 0; // Reset for next play
      }
    }, 2000);
  };

  const resetState = () => {
    setInputValue("");
    setPin("");
    setMessage("");
    setMessageTone("info");
    setReceipt(null);
    setCustomWithdraw(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 350);
  };

  // ---- card lifecycle ----
  const insertCard = () => {
    setCardState("inserting");
    setTimeout(() => {
      setCardState("in");
      setCurrentScreen("pin");
    }, 700);
  };

  const ejectCard = (next) => {
    setCardState("ejecting");
    setTimeout(() => {
      setCardState("out");
      setCurrentScreen(next);
      resetState();
    }, 1800);
  };

  const handleMenuChoice = (choice) => {
    resetState();
    if (choice === "1") {
      setMessage(
        `Tilin saldo: ${saldo.toFixed(
          2,
        )} €\n\nTililtä nostettavissa: ${saldo.toFixed(2)} €`,
      );
      setMessageTone("info");
      setCurrentScreen("saldo");
    } else if (choice === "2") setCurrentScreen("deposit");
    else if (choice === "3") setCurrentScreen("withdraw");
    else if (choice === "4") {
      setMessage("🙏 Kiitos käytöstä! Näkemiin.");
      setMessageTone("info");
      setCurrentScreen("exit");
      ejectCard("idle");
    } else {
      setMessage("❌ Virheellinen valinta.");
      setMessageTone("error");
      setCurrentScreen("message");
    }
  };

  const handleDeposit = () => {
    const summa = parseFloat(inputValue);
    if (isNaN(summa) || summa <= 0) {
      setMessage("Syötä positiivinen numero.");
      setMessageTone("error");
      setReceipt(null);
    } else if (summa > 10000) {
      setMessage("Max 10 000 euroa kerralla.");
      setMessageTone("error");
      setReceipt(null);
    } else {
      const uusiSaldo = saldo + summa;
      setSaldo(uusiSaldo);
      setMessage(
        `💳 ${summa.toFixed(
          2,
        )} € talletus onnistui.\n\nSinun nykyinen saldosi on ${uusiSaldo.toFixed(
          2,
        )} €`,
      );
      setMessageTone("success");
      setReceipt({ type: "TALLETUS", amount: summa, balance: uusiSaldo });
    }
    setCurrentScreen("message");
    setInputValue("");
  };

  const handleWithdraw = (summa) => {
    if (isNaN(summa) || summa <= 0) {
      setMessage("Syötä positiivinen numero.");
      setMessageTone("error");
      setReceipt(null);
    } else if (summa % 5 !== 0) {
      setMessage("Vain seteleitä voi nostaa (5, 10, 20...).");
      setMessageTone("error");
      setReceipt(null);
    } else if (saldo >= summa) {
      const uusiSaldo = saldo - summa;
      setSaldo(uusiSaldo);
      setMessage(
        `Otto ${summa.toFixed(
          2,
        )} € onnistui.\n\nTilin saldo: ${uusiSaldo.toFixed(2)} €`,
      );
      setMessageTone("success");
      setReceipt({ type: "NOSTO", amount: summa, balance: uusiSaldo });
    } else {
      setMessage(`Ei tarpeeksi varoja! (Saldo: ${saldo.toFixed(2)} €)`);
      setMessageTone("error");
      setReceipt(null);
    }
    setCurrentScreen("message");
    setInputValue("");
    setCustomWithdraw(false);
  };

  const handleKeyPress = (key) => {
    if (beepRef.current) {
      beepRef.current.currentTime = 0;
      beepRef.current.play();
    }

    if (key === "STOP") {
      setMessage("🙏 Kiitos käytöstä! Näkemiin.");
      setMessageTone("info");
      setCurrentScreen("exit");
      ejectCard("idle");
    } else if (key === "ENTER") {
      if (currentScreen === "pin") {
        if (pin.length === 4) {
          setPin("");
          setCurrentScreen("menu");
        } else {
          triggerShake();
        }
      } else if (currentScreen === "deposit") {
        if (!inputValue) {
          triggerShake();
        } else {
          performActionWithLoad(handleDeposit);
        }
      } else if (currentScreen === "withdraw" && customWithdraw) {
        if (!inputValue) {
          triggerShake();
        } else {
          performActionWithLoad(() => handleWithdraw(parseFloat(inputValue)));
        }
      }
    } else if (currentScreen === "pin" && pin.length < 4 && !isNaN(key)) {
      setPin(pin + key);
    } else if (currentScreen === "menu" && ["1", "2", "3", "4"].includes(key)) {
      handleMenuChoice(key);
    } else if (["saldo", "message"].includes(currentScreen) && key === "1") {
      setCurrentScreen("menu");
      resetState();
    } else if (
      (currentScreen === "deposit" ||
        (currentScreen === "withdraw" && customWithdraw)) &&
      (!isNaN(key) || key === ".")
    ) {
      if (key === "." && inputValue.includes(".")) return;
      setInputValue(inputValue + key);
    }
  };

  const ScreenTitle = ({ text }) => (
    <motion.h2
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5 }}
      className="text-[clamp(1.2rem,5vw,2.2rem)] font-bold mb-3 text-green-400 mt-2"
    >
      {text}
    </motion.h2>
  );

  const ReceiptSlip = ({ data }) => {
    const lines = [
      "================================",
      "        PANKKIAUTOMAATTI",
      "================================",
      `Tapahtuma: ${data.type}`,
      `Summa: ${data.amount.toFixed(2)} €`,
      `Saldo: ${data.balance.toFixed(2)} €`,
      "--------------------------------",
      "    Kiitos asioinnista!",
    ];
    return (
      <div className="receipt mt-3 mx-auto max-w-[90%] sm:max-w-xs px-3 py-2 text-left">
        {lines.map((l, i) => (
          <p
            key={i}
            className="text-[clamp(0.55rem,2vw,0.7rem)] leading-snug whitespace-pre font-mono"
          >
            {l}
          </p>
        ))}
      </div>
    );
  };

  const BackToMenu = () => (
    <p
      className="border p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950 text-[clamp(0.9rem,3.2vw,1.5rem)] inline-block"
      onClick={() => {
        playBeep();
        setCurrentScreen("menu");
        resetState();
      }}
    >
      ◀ 1. Alkuun
    </p>
  );

  const renderScreenContent = () => {
    if (loading) {
      return (
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="flex flex-col justify-center items-center h-full text-green-400 font-bold text-[clamp(1.2rem,5vw,2.5rem)] mt-10 gap-3 text-center px-2"
        >
          <span>Ole hyvä ja odota hetki..</span>
          <span className="text-[clamp(1.5rem,6vw,2.5rem)] animate-spin">
            💳
          </span>
        </motion.div>
      );
    }

    switch (currentScreen) {
      case "idle":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-2 ">
            <ScreenTitle text="Tervetuloa!" />
            <p className="text-[clamp(0.85rem,3vw,1.25rem)]">
              Aseta pankkikorttisi lukijaan
              <br />
              aloittaaksesi asioinnin.
            </p>
            <div className="text-[clamp(2rem,8vw,3rem)] animate-pulse">💳</div>
            <p
              onClick={() => {
                playBeep();
                insertCard();
              }}
              className="border-2 p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950 text-[clamp(0.85rem,3vw,1.25rem)] font-bold"
            >
              ▶ Syötä kortti
            </p>
          </div>
        );

      case "pin":
        return (
          <div className="flex flex-col items-center justify-center h-full text-center px-2">
            <ScreenTitle text="🔒 Syötä PIN-koodi" />
            <p className="mb-4 text-[clamp(0.8rem,2.8vw,1.1rem)] text-yellow-500 bg-blue-950 p-2">
              Vahvista ENTER-näppäimellä
            </p>
            <div className={`flex gap-3 sm:gap-4 ${shake ? "shake" : ""}`}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-yellow-400 ${
                    i < pin.length ? "bg-yellow-400" : ""
                  }`}
                />
              ))}
            </div>
            <p className="mt-4 text-[clamp(0.7rem,2.4vw,0.9rem)] opacity-70">
              STOP peruuttaa ja palauttaa kortin
            </p>
          </div>
        );

      case "menu":
        return (
          <>
            <ScreenTitle text="Tervetuloa Pankkiautomaattiin!" />
            <p className="mb-3 text-[clamp(1.4rem,6vw,2.5rem)]">Valitse</p>
            <p className="mb-4 text-[clamp(0.8rem,2.8vw,1.25rem)] text-yellow-500 bg-blue-950 p-2">
              Voit lopettaa STOP-näppäimellä.
            </p>
            <div className="flex justify-between px-2 sm:px-8">
              <div className="flex flex-col space-y-3 sm:space-y-4 text-left text-[clamp(0.85rem,3.4vw,1.25rem)] mt-6 sm:mt-10">
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("1");
                  }}
                  className="border-2 p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950"
                >
                  ◀ 1. Saldo
                </p>
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("2");
                  }}
                  className="border-2 p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950"
                >
                  ◀ 2. Talletus
                </p>
              </div>
              <div className="flex flex-col space-y-3 sm:space-y-4 text-right text-[clamp(0.85rem,3.4vw,1.25rem)] mt-6 sm:mt-10">
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("3");
                  }}
                  className="border-2 p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950"
                >
                  3. Otto ▶
                </p>
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("4");
                  }}
                  className="border-2 p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950"
                >
                  4. Lopetus ▶
                </p>
              </div>
            </div>
          </>
        );

      case "saldo":
        return (
          <>
            <ScreenTitle text="Tilin tilanne" />
            <p className="text-[clamp(0.95rem,3.6vw,1.5rem)] whitespace-pre-line">
              {message}
            </p>
            <div className="flex justify-between px-2 sm:px-8">
              <div className="flex flex-col space-y-4 text-left mt-6 sm:mt-10">
                <BackToMenu />
              </div>
            </div>
          </>
        );

      case "deposit":
        return (
          <>
            <ScreenTitle text="💳 Aloita talletus" />
            <p className="mb-4 text-[clamp(0.8rem,2.8vw,1.25rem)] text-yellow-500 bg-blue-950 p-2">
              Kerta talletus max 10 000 €
            </p>
            <p className="text-[clamp(0.85rem,3vw,1.1rem)]">Syötä summa:</p>
            <p
              className={`text-[clamp(1.4rem,7vw,2.5rem)] font-bold ${
                shake ? "shake" : ""
              }`}
            >
              {inputValue || "0"} €
            </p>
          </>
        );

      case "withdraw":
        return (
          <>
            <ScreenTitle text="💵 Otto" />
            <p className="mb-4 text-[clamp(0.8rem,2.8vw,1.25rem)] text-yellow-500 bg-blue-950 p-2">
              Max nosto 10000 € / kerta
            </p>
            {!customWithdraw ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 px-2 sm:px-6 mt-4">
                {[20, 40, 60, 90, 140, 240].map((summa) => (
                  <button
                    key={summa}
                    onClick={() => {
                      playBeep();
                      performActionWithLoad(() => handleWithdraw(summa));
                    }}
                    className="border p-2 sm:p-3 hover:bg-green-700 text-[clamp(0.9rem,3.2vw,1.25rem)]"
                  >
                    {summa} €
                  </button>
                ))}
                <button
                  onClick={() => {
                    playBeep();
                    setCustomWithdraw(true);
                    setInputValue("");
                  }}
                  className="col-span-2 sm:col-span-3 border p-2 sm:p-3 hover:bg-green-700 text-[clamp(0.9rem,3.2vw,1.25rem)]"
                >
                  Muu summa ▶
                </button>
              </div>
            ) : (
              <div className="mt-2 px-2">
                <p className="mb-2 text-[clamp(0.85rem,3vw,1.1rem)]">
                  Syötä nostosumma:
                </p>
                <p
                  className={`text-[clamp(1.4rem,7vw,2.5rem)] font-bold ${
                    shake ? "shake" : ""
                  }`}
                >
                  {inputValue || "—"} €
                </p>
                <p className="mt-2 text-[clamp(0.7rem,2.4vw,0.9rem)] opacity-80">
                  Käytä numpadia ja paina Enter vahvistaaksesi.
                </p>
              </div>
            )}
          </>
        );

      case "message":
        return (
          <>
            <ScreenTitle text="📺 Tiedote" />
            <p className="mb-4 text-[clamp(0.8rem,2.8vw,1.25rem)] text-yellow-500 bg-blue-950 p-2">
              Muista ottaa korttisi!
            </p>
            <p
              className={`text-[clamp(0.85rem,3vw,1.15rem)] whitespace-pre-line ${
                messageTone === "error"
                  ? "text-red-400"
                  : messageTone === "success"
                    ? "text-green-300"
                    : ""
              }`}
            >
              {message}
            </p>
            {receipt && <ReceiptSlip data={receipt} />}
            <div className="flex justify-between px-2 sm:px-8">
              <div className="flex flex-col space-y-4 text-left mt-6 sm:mt-10">
                <BackToMenu />
              </div>
            </div>
          </>
        );

      case "exit":
        return (
          <>
            <div className="mt-10 sm:mt-20 flex flex-col items-center">
              <ScreenTitle text="Kiitos käynnistä" />
              <p className="text-[clamp(1.2rem,5vw,2rem)]">
                Tervetuloa uudelleen.
              </p>
              <div className="text-[clamp(2rem,8vw,3rem)] mt-4 animate-bounce">
                💳
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const numpadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["STOP", "0"],
    ["ENTER"],
  ];

  return (
    <div
      className="w-screen h-screen flex items-center justify-center font-mono bg-cover bg-center p-2"
      style={{ backgroundImage: `url(${bGround})` }}
    >
      <div
        className="flex flex-col w-full h-full max-w-6xl border-[10px] rounded-[28px] shadow-[0_10px_40px_rgba(0,0,0,0.65)] overflow-hidden"
        style={{
          backgroundImage: `url(${atmTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Top Bar */}
        <div className="w-full h-14 sm:h-16 bg-white flex items-center justify-between text-orange-500 font-bold text-2xl sm:text-3xl tracking-widest shadow-white shadow-lg px-2">
          <img
            src={logoHeader}
            alt="Retro Otto Logo"
            className="h-12 sm:h-16 object-contain ml-3 sm:ml-7"
          />
          <button
            onClick={toggleMute}
            aria-label={muted ? "Poista äänten mykistys" : "Mykistä äänet"}
            className="text-base sm:text-xl px-2"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        {/* Card slot */}
        <div className="relative w-full h-3 sm:h-4 flex items-center justify-center bg-transparent">
          <div className="absolute w-3/4 sm:w-1/2 h-1.5 sm:h-2 bg-black/70 rounded-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]" />
          {cardState !== "out" && (
            <div
              className={`absolute w-16 sm:w-24 h-3 sm:h-4 rounded-sm bg-gradient-to-br from-gray-200 to-gray-400 border border-gray-500 ${
                cardState === "inserting"
                  ? "card-inserting"
                  : cardState === "ejecting"
                    ? "card-ejecting"
                    : ""
              }`}
            />
          )}
        </div>

        {/* Screen */}
        <div className="flex-grow flex items-center justify-center p-2 sm:p-4">
          <div className="w-full h-full screenblue border-[6px] border-slate-700 p-4 sm:p-6 rounded-xl text-white text-center relative overflow-hidden shadow-[inset_0_-10px_20px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,255,0,0.1)_3px)] pointer-events-none"></div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentScreen}-${customWithdraw}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 h-full flex flex-col"
                style={{ textShadow: "0 0 4px #00ff00, 0 0 10px #00ff00" }}
              >
                {renderScreenContent()}
              </motion.div>
            </AnimatePresence>

            {/* Intro overlay */}
            {currentScreen === "intro" && (
              <div className="absolute inset-0 screenblue flex items-center justify-center z-50 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.4)] p-4">
                <button
                  onClick={() => {
                    playBeep();
                    startMusic();
                  }}
                  className="px-5 sm:px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-[clamp(0.9rem,3.6vw,1.25rem)] font-bold rounded-lg shadow-lg transition active:scale-95"
                >
                  ▶ Käynnistä automaatti
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Numpad */}
        <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-4 p-2 sm:p-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 border-4 p-3 sm:p-6 gradient rounded-2xl shadow-[inset_0_-10px_20px_rgba(0,0,0,0.8)]">
            {numpadKeys.flat().map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className={`
          btn-8
          w-14 h-11
          sm:w-20 sm:h-14
          border-2
          rounded-lg
          shadow-[0_0_15px_#000]
          transition
          active:scale-95
          flex
          items-center
          justify-center
          leading-none
          overflow-hidden
          text-black
          font-bold
          ${
            key === "STOP"
              ? "bg-red-600 hover:bg-red-700 btn-9 text-[clamp(0.7rem,2.8vw,1rem)]"
              : key === "ENTER"
                ? "bg-blue-600 hover:bg-blue-700 btn-10 text-[clamp(0.55rem,2.2vw,0.95rem)] px-1"
                : "hover:bg-gray-700 text-[clamp(1rem,4vw,1.4rem)]"
          }
        `}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
