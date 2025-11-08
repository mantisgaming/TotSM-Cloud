import { generatePrimeSync, randomInt } from "crypto";

export class CodeGenerator {
    private codeLength: number;
    private maximumCodeSeed: number;
    private codeIncrementor: number;
    private currentCodeSeed: number;

    constructor(codeLength: number = 4) {
        this.codeLength = codeLength;
        this.maximumCodeSeed = Math.pow(26, codeLength);
        this.codeIncrementor = this.generateIncrementor();
        this.currentCodeSeed = randomInt(this.maximumCodeSeed);
    }

    private generateIncrementor(): number {
        var bitCount = Math.ceil(Math.log2(this.maximumCodeSeed)) + 1;
        return Number(generatePrimeSync(bitCount, { bigint: true }));
    }

    generateCode(): string {
        this.currentCodeSeed += this.codeIncrementor;
        this.currentCodeSeed %= this.maximumCodeSeed;
        return this.convertNumberToCode(this.currentCodeSeed);
    }

    private convertNumberToCode(val: number): string {
        var result: string = "";
        
        for (var i = 0; i < this.codeLength; i++) {
            result += String.fromCharCode((val % 26) + 65);
            val /= 26;
            val = Math.floor(val);
        }

        return result;
    }
}