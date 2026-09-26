class NoiseGeneratorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastBrownOut = 0.0;
  }

  static get parameterDescriptors() {
    return [{
      name: 'noiseType',
      defaultValue: 0, // 0 = white, 1 = brown
      minValue: 0,
      maxValue: 1,
      automationRate: 'k-rate'
    }];
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const noiseTypeParam = parameters.noiseType;
    
    // Process all channels (usually just 1 or 2)
    for (let channel = 0; channel < output.length; ++channel) {
      const outputChannel = output[channel];
      const length = outputChannel.length;
      
      for (let i = 0; i < length; ++i) {
        // Evaluate parameter (it can be an array of size 1 or `length`)
        const noiseType = noiseTypeParam.length === 1 ? noiseTypeParam[0] : noiseTypeParam[i];
        
        // Pure white noise: uniform distribution in [-1, 1]
        const white = Math.random() * 2 - 1;
        
        if (noiseType < 0.5) {
          // White noise
          outputChannel[i] = white;
        } else {
          // Brown noise (leaky integration)
          // Leaky factor: 0.99 prevents runaway DC drift
          // Scale factor (e.g. 0.05) keeps integration within safe amplitudes
          this.lastBrownOut = (this.lastBrownOut * 0.99) + (white * 0.05);
          // Scale up output since the integration attenuates highs
          outputChannel[i] = this.lastBrownOut * 2.5; 
        }
      }
    }
    
    return true; // Keep processor alive
  }
}

registerProcessor('noise-generator', NoiseGeneratorProcessor);
