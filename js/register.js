    /**
     * Register Service Worker.
     */
    if (navigator.serviceWorker) {
        navigator.serviceWorker.register('sw.js').then(function (reg) {
            console.log("Service Worker Registered", reg);
        }).catch(function (err) {
            console.log("Service Worker failed to register", err);
        });
    }
