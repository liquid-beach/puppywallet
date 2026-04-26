import React, { useState } from 'react';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

const puppyArt = `                                             +++
                          ++                       +====*
                         +++++*                  +=----=+*
                        +++====+*         -     +=--=++-=*
                        +++++=--=****++++++++**#==-=**=:-*+
                        +==+*#=-=**++++++*+++++++#+*#+-:-+
                        +=-=+#*=+++++++++*+++++++++#*+--=+
                         =-=++*+====+++****++++++++===-:=+
                         =---+==+===+*++***+*==++++++=++++
                          =+===++**+::=*+***--*-=**++==++=
                          =====++--*=--==+====@@%+*#+---=+
                         -=::::=+#%@%#=======*%@@=+-:.::=+
                         =-:...:-:::====+=++=+*==+=::.::-+-
                         =-......::-=--===---=*=::-::::-+-
                         =-.......:--::%%*#@%--++-----::=+
                          =::..::..::..*%@@%=:-==-==-::=+-
                          -=:..:.=+::.:=*#**+-==*%=---=+=
                          -++-...::#%##@@@@@@%@@*-----+*=
                          -+++-:...::*#-==+++#%=----=+##*-
                         -=-=+++-:..:-:#---=*#--=--=+##**=
                         -=----===-:::------==-====+*##*++-
                         -==-:::--=--::---=======+++##*+++-
                         *++=-::::--:::::---======+**+==+*=
                        ++==++=-:---::::::----===+*++++#**+
                       +*+---------:--:::::::---====**++==+
                      -*+=-:..::::::::::.:::::-----=------+-
                      **+==-:...:::::::...::::::-=-:-:::--+-
                     +**+++-:..:.:..:.:.....:::--:::::-:-+=
                   -+***+=====:..::.::::::::::-:-::::::=+*+
                 ---+**++===----=--:.:::::::::--:-:-=**++*+
                --::+**++==---=--:::-::.::::------=--++*++
                =-::-*+++======-----:--::::::----------=+*+
               ==-:::=*+++-====-------::::::---=-::---===+=
               ++==:::+*++-=====---:=+-::::----+:..:-====+
               =+===-::=*+=---==---:=+=-----==++...:--===+
                +*++==-:==+--------:-#*+++=+++*#-.:----==+-+=++=--
                 ++*#*+=-=+----------########*++*.:-----=+%%%##***+=
                  =+=+=*#=-:::-------==++**++****.::-----#@@%%%##**+--
                  -:::+=*+:::--===--=###*##%#%%%%.:------*@@@@@@%%#*+-
                 -=*#+*+%%*---===---+@@   %    @@::-------%%   %
                          :-:-::+:=:-            -:-::::=:--
                          =***+*+*=#+            --*=+-*+*=*`;

function WalletGenerator() {
  const [wallet, setWallet] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const navigate = useNavigate();

  const bark = new Audio('/bark.wav');

  const generateWallet = () => {
    const privateKey = ethers.hexlify(ethers.randomBytes(32));
    const newWallet = new ethers.Wallet(privateKey);
    setWallet({ address: newWallet.address, privateKey: newWallet.privateKey });
    setShowPrivateKey(false);
    bark.play().catch(() => {});
  };

  const togglePrivateKey = () => {
    setShowPrivateKey(v => !v);
    bark.play().catch(() => {});
  };

  const downloadWallet = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [`Address: ${wallet.address}\nPrivate Key: ${wallet.privateKey}`],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = 'puppy_wallet.txt';
    document.body.appendChild(element);
    element.click();
    bark.play().catch(() => {});
  };

  return (
    <div className="page">
      <pre className="puppy-art">{puppyArt}</pre>

      <div className="tagline">ethereum · no extension · no custodian</div>

      <div className="divider">+────────────────────────+</div>

      <div className="btn-row">
        <button className="btn primary" onClick={generateWallet}>[ generate wallet ]</button>
        <button className="btn" onClick={() => navigate('/wallet')}>[ access wallet ]</button>
      </div>

      {wallet && (
        <>
          <div className="divider">+────────────────────────+</div>

          <div className="field-group">
            <span className="term-label">address</span>
            <div className="address-display">{wallet.address}</div>
          </div>

          <div className="qr-wrapper">
            <QRCodeSVG value={wallet.address} size={140} bgColor="#e2e2e2" fgColor="#080808" />
          </div>

          <div className="field-group">
            <span className="term-label">private key</span>
            <div className="address-display">
              {showPrivateKey
                ? wallet.privateKey
                : <span className="key-redacted">{'●'.repeat(66)}</span>
              }
            </div>
            <button className="btn" onClick={togglePrivateKey}>
              {showPrivateKey ? '[ hide key ]' : '[ reveal key ]'}
            </button>
          </div>

          <button className="btn btn-full" onClick={downloadWallet}>
            [ download wallet.txt ]
          </button>

          <div className="warn-box">
            ⚠ store your private key somewhere safe. anyone with access to it controls your funds.
            puppy wallet never stores or transmits your key.
          </div>
        </>
      )}

      <div className="stats-row">
        <div className="stat">
          <div className="stat-label">network</div>
          <div className="stat-value">mainnet <span className="blink">_</span></div>
        </div>
        <div className="stat">
          <div className="stat-label">provider</div>
          <div className="stat-value">alchemy</div>
        </div>
        <div className="stat">
          <div className="stat-label">custody</div>
          <div className="stat-value">self</div>
        </div>
      </div>

      <div className="divider">+────────────────────────+</div>

      <div className="warn-box" style={{ fontSize: '9px', color: 'var(--fg-5)', textAlign: 'center' }}>
        🐾 donations: 0x9811d968C1cc272392781561780935bAdb09B742
      </div>
    </div>
  );
}

export default WalletGenerator;
