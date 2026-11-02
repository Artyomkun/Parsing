const config = {
    compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'nodenext',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        outDir: './dist',
        rootDir: './MyApp/src',
        sourceMap: true,
    },
    include: ['./MyApp/src'],
    exclude: ['node_modules', 'dist'],
};

export default config;