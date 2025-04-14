// app.js - VinBank DApp

let provider;
let signer;
let contract;
let userAddress;

const CONTRACT_ADDRESS = "0xAFD8E0e13EF9d9F63b2af94264A34cFBd2F148Dd";
const TOKEN_ADDRESS = "0x941F63807401efCE8afe3C9d88d368bAA287Fac4";

const ABI = [...]; // Paste VinBank ABI here
const TOKEN_ABI = [...]; // Paste VIN Token ABI here

async function connectWallet() {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    document.getElementById("wallet-address").innerText = userAddress;
    loadSummary();
  } else {
    alert("Please install a Web3 wallet like MetaMask or Viction.");
  }
}

async function approveAndCall(fn, amount) {
  const token = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
  const allowance = await token.allowance(userAddress, CONTRACT_ADDRESS);
  if (allowance.lt(amount)) {
    const tx = await token.approve(CONTRACT_ADDRESS, amount);
    await tx.wait();
  }
  await fn();
}

async function deposit() {
  const amount = ethers.utils.parseEther(document.getElementById("deposit-amount").value);
  await approveAndCall(async () => {
    const tx = await contract.deposit(amount);
    await tx.wait();
    loadSummary();
    alert("✅ Deposit successful");
  }, amount);
}

async function borrow() {
  const tx = await contract.borrow();
  await tx.wait();
  loadSummary();
  alert("✅ Borrow successful");
}

async function repay() {
  const info = await contract.getPosition(userAddress);
  const repayAmount = info[4];
  await approveAndCall(async () => {
    const tx = await contract.repay();
    await tx.wait();
    loadSummary();
    alert("✅ Loan repaid");
  }, repayAmount);
}

async function withdraw() {
  const tx = await contract.withdraw();
  await tx.wait();
  loadSummary();
  alert("✅ Withdrawal successful");
}

async function loadSummary() {
  const summary = await contract.getPosition(userAddress);
  document.getElementById("summary").innerHTML = `
    <b>Deposited:</b> ${ethers.utils.formatEther(summary[0])} VIN<br>
    <b>Earned (Interest):</b> ${ethers.utils.formatEther(summary[1])} VIN<br>
    <b>Borrowed:</b> ${ethers.utils.formatEther(summary[2])} VIN<br>
    <b>Interest Due:</b> ${ethers.utils.formatEther(summary[3])} VIN<br>
    <b>Total Repayment:</b> ${ethers.utils.formatEther(summary[4])} VIN
  `;
}
