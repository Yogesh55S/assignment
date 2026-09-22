import { generateInterviewPrepKit } from "./kitPipeline.js";
import type {
  GenerateKitInput,
  GenerateKitOptions,
  GeneratedKitResult,
} from "./generationTypes.js";

export { generateInterviewPrepKit };

export class GenerationService {
  async generateKit(
    input: GenerateKitInput,
    options?: GenerateKitOptions
  ): Promise<GeneratedKitResult> {
    return generateInterviewPrepKit(input, options);
  }
}
