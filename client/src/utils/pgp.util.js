import * as openpgp from 'openpgp';

const downloadKeyData = (username, passphrase, publicKeyArmored, privateKeyArmored)=>{
    const element = document.createElement("a");

    let dataToWrite = username + '\n\n' + passphrase + '\n\n' + publicKeyArmored + '\n' + privateKeyArmored;

    const file = new Blob([dataToWrite], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);

    element.download = "PGP_KEY_BACKUP.txt";
    document.body.appendChild(element);

    element.click();
};

//generate pgp keypair
const generateKeypair = async ({username, passphrase, save})=>{
    const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 4096,
        userIDs: [{ userID: username }],
        passphrase: passphrase
    });

    if(save){ //save keypair to browser localstorage if applicable
        localStorage.setItem('keypair', JSON.stringify({ privateKey, publicKey, passphrase, username }));
    }

    downloadKeyData(username, passphrase, publicKey, privateKey);

    return { privateKey, publicKey, passphrase, username };
};

//encrypt message
const encryptMessage = async (publicKeyArmored, message)=>{
    //parse public key
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys: publicKey,
    });

    return encrypted;
};

//decrypt message
const decryptMessage = async (privateKeyArmored, passphrase, armoredMessage)=>{
     // parse armored message
    const message = await openpgp.readMessage({
        armoredMessage: armoredMessage
    });

    // parse private key
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
        passphrase
    });

    // decrypt message
    const decrypted = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey
    });

    //join message parts into a single string
    const chunks = [];
    for await (const chunk of decrypted.data) {
        chunks.push(chunk);
    }
    const plaintext = chunks.join('');

    return plaintext;
};

export {
    generateKeypair,
    encryptMessage,
    decryptMessage
};