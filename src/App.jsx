// ================================
// REALISTIC FINNISH OTTO ATM
// FULL WORKING App.js WITH REAL FRAME
// ================================

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

import bGround from "./assets/bg.jpg";
import atmTexture from "./assets/atm-texture.png";
import atmFrame from "./assets/atm-frame.png";
import logoHeader from "./assets/logo.png";

function App() {
  const [saldo, setSaldo] = useState(1000.0);
  const [currentScreen, setCurrentScreen] = useState("intro");

  const [inputValue, setInputValue] = useState("");
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [customWithdraw, setCustomWithdraw] = useState(false);

  const [cardState, setCardState] = useState("out");
  const [muted, setMuted] = useState(false);

  // FIXED: Declared missing states used throughout the app
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState(""); // "success" or "error"
  const [receipt, setReceipt] = useState(null);
  const [shake, setShake] = useState(false);

  const ambientRef = useRef(null);
  const beepRef = useRef(null);
  const cashRef = useRef(null);
  const successRef = useRef(null);

  // =========================================
  // AUDIO
  // =========================================

  const startMusic = () => {
    if (!ambientRef.current) {
      ambientRef.current = new Audio("/ambience.mp3");
      ambientRef.current.loop = true;
      ambientRef.current.volume = 0.5;
    }

    if (!beepRef.current) {
      beepRef.current = new Audio("/beep.mp3");
      beepRef.current.volume = 0.9;
    }

    if (!cashRef.current) {
      cashRef.current = new Audio("/wait.mp3");
      cashRef.current.volume = 2;
    }

    ambientRef.current.play().catch(() => {});
    setCurrentScreen("idle");
  };

  const playBeep = () => {
    if (beepRef.current && !muted) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch(() => {});
    }
  };

  const playCash = () => {
    if (cashRef.current && !muted) {
      cashRef.current.currentTime = 0;

      cashRef.current.play().catch(() => {});

      // STOP AFTER 3s
      setTimeout(() => {
        if (cashRef.current) {
          cashRef.current.pause();
          cashRef.current.currentTime = 0;
        }
      }, 4000);
    }
  };

  const playSuccess = () => {
    if (successRef.current && !muted) {
      successRef.current.currentTime = 0;
      successRef.current.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);

    if (ambientRef.current) ambientRef.current.muted = next;
    if (beepRef.current) beepRef.current.muted = next;
    if (cashRef.current) cashRef.current.muted = next;
    if (successRef.current) successRef.current.muted = next;
  };

  // =========================================
  // CARD
  // =========================================

  const insertCard = () => {
    setCardState("inserting");

    setTimeout(() => {
      setCardState("in");
      setCurrentScreen("pin");
    }, 700);
  };

  // =========================================
  // MENU & LOGIC
  // =========================================

  const handleMenuChoice = (choice) => {
    if (choice === "1") {
      // FIXED: Populate standard saldo layout when selected
      setMessage(
        `Tilin saldo: ${saldo.toFixed(2)} + \nTililtä nostettavissa: ${saldo.toFixed(2)} +\nKortin käteisnostovara: ${saldo.toFixed(2)} +`,
      );
      setMessageTone("");
      setReceipt(null);
      setCurrentScreen("saldo");
    }

    if (choice === "2") {
      setInputValue("");
      setCurrentScreen("deposit");
    }

    if (choice === "3") {
      setCustomWithdraw(false);
      setInputValue("");
      setCurrentScreen("withdraw");
    }

    if (choice === "4") {
      showExitScreen();
    }
  };

  // HELPER: Reusable action loader wrapper
  const performActionWithLoad = (actionCallback) => {
    playCash();

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      actionCallback();
    }, 1200);
  };

  const handleDeposit = () => {
    const summa = parseFloat(inputValue);
    if (isNaN(summa) || summa <= 0) {
      setMessage("Syötä positiivinen numero.");
      setMessageTone("error");
      setReceipt(null);
      triggerShake();
    } else if (summa > 10000) {
      setMessage("Max 10 000 euroa kerralla.");
      setMessageTone("error");
      setReceipt(null);
      triggerShake();
    } else {
      const uusiSaldo = saldo + summa;
      setSaldo(uusiSaldo);
      setMessage(
        `💳 ${summa.toFixed(2)} € talletus onnistui.\n\nSinun nykyinen saldosi on ${uusiSaldo.toFixed(2)} €`,
      );
      setMessageTone("success");
      playSuccess();
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
      triggerShake();
    } else if (summa % 5 !== 0) {
      setMessage("Vain seteleitä voi nostaa (5, 10, 20...).");
      setMessageTone("error");
      setReceipt(null);
      triggerShake();
    } else if (saldo >= summa) {
      const uusiSaldo = saldo - summa;
      setSaldo(uusiSaldo);
      setMessage(
        `Otto ${summa.toFixed(2)} € onnistui.\n\nTilin saldo: ${uusiSaldo.toFixed(2)} €`,
      );
      setMessageTone("success");
      setReceipt({ type: "NOSTO", amount: summa, balance: uusiSaldo });
    } else {
      setMessage(`Ei tarpeeksi varoja! (Saldo: ${saldo.toFixed(2)} €)`);
      setMessageTone("error");
      setReceipt(null);
      triggerShake();
    }
    setCurrentScreen("message");
    setInputValue("");
    setCustomWithdraw(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // =========================================
  // EXIT SCREEN
  // =========================================

  const showExitScreen = () => {
    setCurrentScreen("exit");

    setTimeout(() => {
      setCurrentScreen("idle");
      setPin("");
      setInputValue("");
      setCustomWithdraw(false);
      setCardState("out");
      setMessage("");
      setReceipt(null);
    }, 2500);
  };

  // =========================================
  // KEYPAD
  // =========================================

  const handleKeyPress = (key) => {
    playBeep();

    // STOP
    if (key === "STOP") {
      showExitScreen();
      return;
    }

    // ENTER
    if (key === "OK") {
      if (currentScreen === "pin") {
        if (pin.length === 4) {
          setCurrentScreen("menu");
        } else {
          triggerShake();
        }
        return;
      }

      // FIXED: Redirect layout logic directly to your central handlers with the loader
      if (currentScreen === "deposit") {
        performActionWithLoad(() => handleDeposit());
        return;
      }

      if (currentScreen === "withdraw" && customWithdraw) {
        const amount = parseFloat(inputValue);
        performActionWithLoad(() => handleWithdraw(amount));
        return;
      }
    }

    // PIN INPUT
    if (currentScreen === "pin") {
      if (!isNaN(key) && pin.length < 4) {
        setPin((prev) => prev + key);
      }
      return;
    }

    // MENU INPUT
    if (currentScreen === "menu") {
      if (["1", "2", "3", "4"].includes(key)) {
        handleMenuChoice(key);
      }
      return;
    }

    // DEPOSIT INPUT
    if (currentScreen === "deposit") {
      if (!isNaN(key) || key === ".") {
        setInputValue((prev) => prev + key);
      }
      return;
    }

    // CUSTOM WITHDRAW INPUT
    if (currentScreen === "withdraw" && customWithdraw) {
      if (!isNaN(key) || key === ".") {
        setInputValue((prev) => prev + key);
      }
      return;
    }
  };

  // =========================================
  // INLINE MISSING SUBCOMPONENTS
  // =========================================

  const BackToMenu = () => (
    <button
      onClick={() => {
        playBeep();
        setCurrentScreen("menu");
      }}
      className="border-2 p-3 text-left cursor-pointer border-blue-950 hover:bg-green-700 text-sm"
    >
      ◀ Palaa päävalikkoon
    </button>
  );

  const ReceiptSlip = ({ data }) => (
    <div className="mt-4 p-3 bg-white text-black font-mono text-left text-xs max-w-xs mx-auto rounded shadow-md">
      <p className="text-center font-bold border-b border-dashed border-gray-400 pb-1 mb-1">
        OTTO KUITTI
      </p>
      <p>TAPAHTUMA: {data.type}</p>
      <p>MÄÄRÄ: {data.amount.toFixed(2)} €</p>
      <p>JÄLJELLÄ: {data.balance.toFixed(2)} €</p>
      <p className="text-center text-[9px] mt-2 text-gray-500">
        Kiitos asioinnistasi!
      </p>
    </div>
  );

  const ScreenTitle = ({ text }) => (
    <h2 className="text-[clamp(1.7rem,6vw,3rem)] tracking-wide mb-6">{text}</h2>
  );

  // =========================================
  // SCREENS RENDERER
  // =========================================

  const renderScreenContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="text-3xl text-green-300 animate-pulse">
              ODOTA HETKI...
            </p>
            <p className="mt-4 text-xl">Tapahtumaa käsitellään</p>
          </div>
        </div>
      );
    }

    switch (currentScreen) {
      case "idle":
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ScreenTitle text="TERVETULOA" />
            <p className="text-[clamp(0.9rem,2vw,1.2rem)] leading-relaxed">
              Aseta pankkikortti automaattiin
              <br />
              aloittaaksesi asioinnin.
            </p>
            <div className="mt-8 text-5xl animate-pulse">💳</div>
            <button
              onClick={() => {
                playBeep();
                insertCard();
              }}
              className="mt-8 border border-green-700 px-8 py-4 hover:bg-green-900 transition text-green-300"
            >
              ▶ SYÖTÄ KORTTI
            </button>
          </div>
        );

      case "pin":
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-full max-w-[820px] py-2">
              <h1 className="text-[clamp(2rem,2vw,3rem)] text-white font-light tracking-wide">
                Näppäile tunnusluku
              </h1>
            </div>
            <div className="px-8 py-2 mb-10 bg-blue-950 w-full">
              <p className=" text-3xl text-yellow-500 p-2">
                Suojaa tunnuslukusi
              </p>
            </div>
            <div className="relative flex flex-col items-center z-0 pb-4">
              <div className="absolute -top-10 flex gap-3 z-10">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="text-white text-[clamp(2rem,4vw,3.5rem)] tracking-[6px]"
                  >
                    {i < pin.length ? "*" : ""}
                  </span>
                ))}
              </div>
              <div className="w-[260px] h-[260px] bg-[#2f43c7] flex absolute items-center justify-center shadow-[inset_0_0_30px_rgba(0,0,0,0.45)]">
                <div className="text-[7rem] opacity-30">🤚</div>
              </div>
            </div>
            <p className="mt-12 text-[clamp(1.5rem,3vw,2.4rem)] text-white font-light">
              Lopuksi paina OK
            </p>
            <p className="mt-40 text-6xl text-green-300 opacity-90">
              Lopuksi paina OK
            </p>
          </div>
        );

      case "menu":
        return (
          <>
            <div className="mx-auto  mb-4 w-full max-w-[820px] title-bg rounded-xl">
              <h1 className="text-7xl p-8 text-center">Valitse</h1>
            </div>
            <p className="mb-4 text-3xl text-yellow-500 bg-blue-950 p-2 text-center ">
              Voit lopettaa STOP-näppäimellä.
            </p>
            <div className="flex justify-between px-2 sm:px-8">
              <div className="flex flex-col lg:text-3xl xl:text-5xl mt-6 sm:mt-10 text-sm">
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("1");
                  }}
                  className="border-2 border-b-0 p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950 text-left"
                >
                  ◀ Saldo
                </p>
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("2");
                  }}
                  className="border-2  p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950 text-left"
                >
                  ◀ Talletus
                </p>
              </div>
              <div className="flex flex-col text-right lg:text-3xl xl:text-5xl mt-6 sm:mt-10 text-sm">
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("3");
                  }}
                  className="border-2 p-3 border-b-0 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950 text-right"
                >
                  Otto ▶
                </p>
                <p
                  onClick={() => {
                    playBeep();
                    handleMenuChoice("4");
                  }}
                  className="border-2 p-3 sm:p-4 cursor-pointer hover:bg-green-700 border-blue-950 text-right"
                >
                  Lopetus ▶
                </p>
              </div>
            </div>
          </>
        );

      case "saldo":
        return (
          <>
            <div className="mx-auto w-full max-w-[820px] "></div>
            <h1 className="text-7xl p-8 text-center title-bg rounded-xl">
              {" "}
              <ScreenTitle text="Tilin tilanne" />
            </h1>
            <p className="text-3xl whitespace-pre-line mb-6 mt-8">{message}</p>
            <div className="flex flex-col items-center mt-6">
              <BackToMenu />
            </div>
          </>
        );

      case "deposit":
        return (
          <>
            <div className="mx-auto w-full max-w-[820px] rounded-xl">
              <h1 className="text-7xl p-4 text-center">
                {" "}
                <ScreenTitle text="Aloita talletus" />
              </h1>
            </div>

            <p className="mb-4 text-3xl text-yellow-500 bg-blue-950 p-2 text-center">
              Kertatalletus yhteensä enintään 10 000 euroa
            </p>

            <p className="mb-4 text-2xl text-white p-2">
              Kortti ja tili tunnistettu.
            </p>

            <p className="text-6xl text-center ">Syötä summa:</p>
            <p
              className={`text-8xl font-bold text-center ${shake ? "animate-bounce" : ""}`}
            >
              {inputValue || "0"} €
            </p>
            <p className="mb-4 text-xl text-blue-400 p-2 pt-12">
              SUMMASTA VELOITETAAN PANKIN HINNASTON
              <br /> TAI ASIAKASSOPIMUKSEN MUKAINEN PALKKIO
            </p>
          </>
        );

      case "withdraw":
        return (
          <>
            <div className="mx-auto w-full max-w-[820px] rounded-xl title-bg">
              <h1 className="p-6 text-center text-7xl">Otto</h1>
            </div>

            <p
              id="withdraw-title"
              className="mb-4 text-4xl text-white p-2 text-center"
            >
              Valitse tai syötä nostosumma
            </p>

            {!customWithdraw ? (
              <div className="grid grid-cols-3 px-2 sm:px-6 mt-4 ">
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
                <p className="mb-2 text-4xl text-center">Syötä nostosumma:</p>
                <p
                  className={`text-5xl text-center font-bold ${shake ? "animate-bounce" : ""}`}
                >
                  {inputValue || "—"} €
                </p>
                <p className="mt-2 text-2xl opacity-80 text-blue-400 pt-20">
                  Käytä numpadia ja paina OK vahvistaaksesi.
                </p>
              </div>
            )}
          </>
        );

      case "message":
        return (
          <>
            <ScreenTitle text="📺 Tiedote" />
            <p className="mb-4 text-3xl text-yellow-500 bg-blue-950 p-2 text-center">
              Muista ottaa korttisi!
            </p>
            <p
              className={`text-3xl text-center whitespace-pre-line ${
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
            <div className="flex flex-col items-center mt-6">
              <BackToMenu />
            </div>
          </>
        );

      case "exit":
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-full max-w-[900px]">
              <h1 className="text-[clamp(2.5rem,6vw,5rem)] text-white tracking-wide mb-6">
                Kiitos käynnistä
              </h1>

              <div className="bg-blue-950 py-4 px-6 mb-10 border border-blue-800">
                <p className="text-[clamp(1.4rem,3vw,2.2rem)] text-yellow-400">
                  Tervetuloa uudelleen.
                </p>
              </div>

              <div className="flex justify-center">
                <div className="text-[clamp(4rem,10vw,8rem)] animate-bounce">
                  💳
                </div>
              </div>

              <p className="mt-12 text-[clamp(1rem,2vw,1.4rem)] text-green-300 opacity-90">
                Muista ottaa korttisi.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const numpadKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["STOP", "0", "OK"],
  ];

  return (
    <div
      className="w-screen h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{ backgroundImage: `url(${bGround})` }}
    >
      <div
        className="relative w-[70%] h-screen bg-black overflow-hidden shadow-2xl"
        style={{
          backgroundImage: `url(${atmFrame})`,
          backgroundSize: "center",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute top-14 right-56 z-30">
          <button
            onClick={toggleMute}
            className="text-3xl text-zinc-700 hover:text-black transition"
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        <div
          className="absolute bg-[#0a0f1c] rounded-xl overflow-hidden shadow-inner"
          style={{
            left: "14.9%",
            top: "18.8%",
            width: "55.4%",
            height: "49.5%",
            zIndex: 5,
          }}
        >
          <div className="screenblue relative w-full h-full rounded-xl overflow-hidden text-white p-6 shadow-[inset_0_-20px_40px_rgba(0,0,0,0.55)]">
            <div className="absolute inset-0 crt-lines pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,1)] " />
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 h-full flex flex-col"
                style={{ textShadow: "0 0 4px rgba(120,255,120,0.25)" }}
              >
                {renderScreenContent()}
              </motion.div>
            </AnimatePresence>

            {currentScreen === "intro" && (
              <div className="absolute inset-0 flex items-center justify-center z-20 flex-col crt-lines">
                <button
                  onClick={() => {
                    playBeep();
                    startMusic();
                  }}
                  className="border border-green-600 px-10 py-5 text-green-300 hover:bg-green-900 transition"
                >
                  ▶ KÄYNNISTÄ AUTOMAATTI
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NUMPAD */}
        <div
          className="absolute z-100"
          style={{
            left: "32.9%",
            bottom: "0%",
            top: "72%",
            width: "24.5%",
            height: "29.8%",
            zIndex: 5,
          }}
        >
          <div className="gradient border border-zinc-700 rounded-2xl p-8 xl:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] h-full lg:px-16">
            <div className="grid grid-cols-3 gap-4">
              {numpadKeys.flat().map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`btn-8 h-10 w-18 rounded-lg font-bold text-black flex items-center justify-center active:translate-y-[2px] transition-all shadow-[0_6px_12px_rgba(0,0,0,0.5)] ${
                    key === "STOP"
                      ? "btn-9 text-sm"
                      : key === "OK"
                        ? "btn-10 text-sm"
                        : "text-2xl"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${atmFrame})`,
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            zIndex: 20,
          }}
        />
      </div>
    </div>
  );
}

export default App;
