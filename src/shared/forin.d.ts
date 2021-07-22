interface Module {
    // define Module member types
    forin: (t: any, callback: (k: any, v: any) => void) => void
}

// create a value from our type
declare const Module: Module;

export = Module;