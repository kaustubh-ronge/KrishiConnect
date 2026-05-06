
import { execSync } from 'child_process';

function run(cmd) {
    console.log(`\n🏃 Running: ${cmd}`);
    try {
        const out = execSync(`node ${cmd}`, { encoding: 'utf-8' });
        console.log(out);
        return true;
    } catch (e) {
        console.log(`❌ FAILED: ${cmd}`);
        console.log(e.stdout || e.message);
        return false;
    }
}

console.log("💎💎 KRISHICONNECT MEGA SYSTEM AUDIT v2.0 💎💎");
console.log("==============================================");

const scripts = [
    "scratch/ActionLogicVerification.mjs",
    "scratch/CartFixVerification.mjs",
    "scratch/SettlementFixVerification.mjs",
    "scratch/FinalFixVerification.mjs",
    "scratch/CRUDVerification.mjs",
    "scratch/CartRaceProof.mjs"
];

let allPass = true;
scripts.forEach(s => {
    if (!run(s)) allPass = false;
});

console.log("\n==============================================");
if (allPass) {
    console.log("🏁 GLOBAL TEST RESULT: ALL PASS ✅");
    console.log("System is stable, idempotent, and secure.");
} else {
    console.log("🏁 GLOBAL TEST RESULT: FAIL ❌");
    console.log("Some issues persist. Check logs above.");
}
console.log("==============================================\n");
