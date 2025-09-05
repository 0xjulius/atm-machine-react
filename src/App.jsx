// App.js
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import bGround from "./assets/bg.jpg";
import atmTexture from "./assets/atm-texture.png";

const beepSound = new Audio("/beep.mp3"); // Place in public/

function App() {
  const [saldo, setSaldo] = useState(1000.0);
  const [currentScreen, setCurrentScreen] = useState("menu");
  const [inputValue, setInputValue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [customWithdraw, setCustomWithdraw] = useState(false); // NEW

  const performActionWithLoad = (action) => {
    setLoading(true);
    setTimeout(() => {
      action();
      beepSound.play();
      setLoading(false);
    }, 2000);
  };

  const resetState = () => {
    // NEW
    setInputValue("");
    setMessage("");
    setCustomWithdraw(false);
  };

  const handleMenuChoice = (choice) => {
    resetState(); // NEW: nollaa custom-tilan
    if (choice === "1")
      setMessage(`Tilin saldo: ${saldo.toFixed(2)}+`),
        setCurrentScreen("saldo"); 
    else if (choice === "2") setCurrentScreen("deposit");
    else if (choice === "3") setCurrentScreen("withdraw");
    else if (choice === "4")
      setMessage("🙏 Kiitos käytöstä! Näkemiin."), setCurrentScreen("exit");
    else setMessage("❌ Virheellinen valinta."), setCurrentScreen("message");
  };

  const handleDeposit = () => {
    const summa = parseFloat(inputValue);
    if (isNaN(summa) || summa <= 0) {
      setMessage("Syötä positiivinen numero.");
    } else if (summa > 10000) {
      setMessage("Max 10 000 euroa kerralla.");
    } else {
      const uusiSaldo = saldo + summa;
      setSaldo(uusiSaldo);
      setMessage(
        `💳 ${summa.toFixed(
          2
        )} € talletus onnistui.\n\nSinun nykyinen saldosi on ${uusiSaldo.toFixed(
          2
        )} €`
      );
    }
    setCurrentScreen("message");
    setInputValue("");
  };

  const handleWithdraw = (summa) => {
    if (isNaN(summa) || summa <= 0) {
      setMessage("Syötä positiivinen numero.");
    } else if (summa % 5 !== 0) {
      setMessage("Vain seteleitä voi nostaa (5, 10, 20...).");
    } else if (saldo >= summa) {
      const uusiSaldo = saldo - summa;
      setSaldo(uusiSaldo);
      setMessage(
        `Otto euroa ${summa.toFixed(
          2
        )}-\n\nTilin saldo ${uusiSaldo.toFixed(2)}+`
      );
    } else {
      setMessage(`Ei tarpeeksi varoja! (Saldo: ${saldo.toFixed(2)} €)`);
    }
    setCurrentScreen("message");
    setInputValue("");
    setCustomWithdraw(false); // NEW: pois custom-tilasta nosto jälkeen
  };

  const handleKeyPress = (key) => {
    if (key === "enter") {
      if (currentScreen === "deposit") performActionWithLoad(handleDeposit);
      if (currentScreen === "withdraw" && customWithdraw && inputValue)
        performActionWithLoad(() => handleWithdraw(parseFloat(inputValue))); // NEW
    } else if (key === "back") {
      // STOP = suoraan exit
      setMessage("🙏 Kiitos käytöstä! Näkemiin.");
      setCurrentScreen("exit");
      resetState();
    } else {
      setInputValue(inputValue + key);
    }
  };

  const ScreenTitle = ({ text }) => (
    <motion.h2
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5 }}
      className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-green-400 mt-4"
    >
      {text}
    </motion.h2>
  );

  const renderScreenContent = () => {
    if (loading) {
      return (
        <motion.div
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="flex justify-center items-center h-full text-green-400 font-bold text-4xl mt-20"
        >
          Ole hyvä ja odota hetki..
        </motion.div>
      );
    }

    switch (currentScreen) {
      case "menu":
        return (
          <>
            <ScreenTitle text="Tervetuloa Pankkiautomaattiin!" />
            <p className="mb-4 text-4xl">Valitse</p>
            <p className="mb-4 text-2xl text-yellow-500 bg-blue-950 h-15 p-2">
              Voit lopettaa STOP-näppäimellä
            </p>

            <div className="flex justify-between px-8">
              <div className="flex flex-col space-y-4 text-left text-2xl mt-10 ">
                <p className=" border-black/50 border-2 pb-4 p-4">◀ 1. Saldo</p>
                <p className=" border-black/50 border-2 pb-4 p-4">
                  ◀ 2. Talletus
                </p>
              </div>
              <div className="flex flex-col space-y-4 text-right text-2xl mt-10">
                <p className="p-4 border-black/50 border-2 pb-4">3. Otto ▶</p>
                <p className="p-4 border-black/50 border-2 pb-4">
                  4. Lopetus ▶
                </p>
              </div>
            </div>
          </>
        );

      case "saldo":
        return (
          <>
            <ScreenTitle text="💰 Saldo" />
            <p className="text-2xl">{message}</p>
            <div className="flex justify-between px-8">
              <div className="flex flex-col space-y-4 text-left text-2xl mt-10 ">
                <p className=" border-black/50 border-2 p-4 mt-20">
                  ◀ 1. Alkuun
                </p>
              </div>
            </div>
          </>
        );

      case "deposit":
        return (
          <>
            <ScreenTitle text="💳 Aloita talletus" />
            <p className="mb-4 text-2xl text-yellow-500 bg-blue-950 h-15 p-2">
              Kerta talletus max 10 000 €
            </p>
            <p>Syötä summa:</p>
            <p className="text-2xl sm:text-3xl font-bold">{inputValue}</p>
          </>
        );

      case "withdraw":
        return (
          <>
            <ScreenTitle text="💵 Nosto" />
            <p className="mb-4 text-2xl text-yellow-500 bg-blue-950 h-15 p-2">
              Max nosto 440 € / kerta
            </p>

            <div className="flex justify-between px-8 mt-6">
              {/* Vasemman puolen summat */}
              <div className="flex flex-col space-y-4 text-left text-2xl">
                {[20, 40, 60].map((summa) => (
                  <button
                    key={summa}
                    onClick={() => handleWithdraw(summa)}
                    className="border p-2 hover:bg-green-700"
                  >
                    ◀ {summa} €
                  </button>
                ))}
              </div>

              {/* Oikean puolen summat */}
              <div className="flex flex-col space-y-4 text-right text-2xl">
                {[90, 140, 240].map((summa) => (
                  <button
                    key={summa}
                    onClick={() => handleWithdraw(summa)}
                    className="border p-2 hover:bg-green-700"
                  >
                    {summa} € ▶
                  </button>
                ))}
                <button
                  onClick={() => {
                    setCustomWithdraw(true); // NEW: aktivoi custom-tila
                    setInputValue(""); // NEW: tyhjennä vanha syöte
                  }}
                  className="border p-2 hover:bg-green-700"
                >
                  Muu summa ▶
                </button>
              </div>
            </div>

            {/* Custom-syöte näkyviin vain kun valittu */}
            {customWithdraw && (
              <div className="mt-2">
                <p className="mb-2">Syötä nostosumma:</p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {inputValue || "—"}
                </p>
                <p className="mt-2 text-sm opacity-80">
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
            <p className="text-lg whitespace-pre-line">{message}</p>
            <div className="flex justify-between px-8">
              <div className="flex flex-col space-y-4 text-left text-2xl mt-10 ">
                <p className=" border-black/50 border-2 p-4 mt-20">
                  ◀ 1. Alkuun
                </p>
              </div>
            </div>
          </>
        );

      case "exit":
        return (
          <>
            <ScreenTitle text="👋 Kiitos!" />
            <p className="text-lg">{message}</p>
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
    ["*", "0", "#"],
  ];

  return (
    <div
      className="w-screen h-screen flex items-center justify-center font-mono bg-cover bg-center p-2"
      style={{ backgroundImage: `url(${bGround})` }}
    >
      <div
        className="flex flex-col w-full h-full max-w-3xl border-8 border-yellow-600 rounded-2xl shadow-[0_0_40px_#ff0] overflow-hidden"
        style={{
          backgroundImage: `url(${atmTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Top Bar */}
        <div className="w-full h-14 sm:h-16 bg-gradient-to-b from-yellow-700/80 to-yellow-900/80 flex justify-center items-center text-white font-bold text-xl sm:text-3xl tracking-widest shadow-inner">
          RETRO OTTO 3000
        </div>

        {/* Screen */}
        <div className="flex-grow flex items-center justify-center p-4 ">
          <div className="w-full h-full screenblue border-4 border-black p-4 text-white text-center shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(0,255,0,0.1)_3px)] pointer-events-none"></div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen + message + customWithdraw} // NEW: vaihtuu myös custom-tilassa
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 space-y-2"
                style={{
                  textShadow: "0 0 4px #00ff00, 0 0 10px #00ff00",
                }}
              >
                {renderScreenContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Numpad + Buttons */}
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {numpadKeys.flat().map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (
                    ["1", "2", "3", "4"].includes(key) &&
                    currentScreen === "menu"
                  ) {
                    handleMenuChoice(key);
                  } else if (currentScreen === "saldo" && key === "1") {
                    setCurrentScreen("menu");
                    resetState();
                  } else if (
                    // numerot talletukseen
                    currentScreen === "deposit" &&
                    !isNaN(key)
                  ) {
                    handleKeyPress(key);
                  } else if (
                    // numerot nostoon vain, kun Muu summa on valittu
                    currentScreen === "withdraw" &&
                    customWithdraw &&
                    !isNaN(key)
                  ) {
                    handleKeyPress(key);
                  }
                }}
                className="w-16 h-12 sm:w-20 sm:h-14 bg-gray-800 border-2 border-yellow-600 hover:bg-gray-700 text-yellow-400 font-bold text-lg sm:text-xl rounded-lg shadow-[0_0_15px_#ff0] transition active:scale-95"
              >
                {key}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => handleKeyPress("back")}
              className="w-28 h-12 sm:h-14 bg-red-600 text-white font-bold rounded shadow-lg transition active:scale-95"
            >
              ◀ STOP
            </button>
            <button
              onClick={() => handleKeyPress("enter")}
              className="w-28 h-12 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-lg transition active:scale-95"
            >
              ▶ Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
