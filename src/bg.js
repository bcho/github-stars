(function() {
    var _ = function (markup, data) {
        var pattern = /<%=([\w ]+)%>/g,
            key;

        while ((key = pattern.exec(markup)) !== null) {
            markup = markup.replace(key[0], data[key[1].trim()]);
        }

        return markup;
    };

    var runCodeWrapper = function (snippet) {
        var tmpl = [
        '(function () {',
            'try {',
                'var script = document.createElement("script");',
                'script.type = "text/javascript";',
                'script.innerHTML = "<%= snippet %>";',
                'document.body.appendChild(script);',
                'window.setTimeout(function () {',
                    'script.parentElement.removeChild(script);',
                '}, 10);',
            '} catch (e) {',
                'console.error(e);',
            '}',
        '})();'].join('\n');

        return _(tmpl, {snippet: snippet.split('"').join('\\"')});
    };

    chrome.runtime.onMessage.addListener(function (req, sender, sendResp) {
        console.log('Execute code in the background.');
        console.debug(req.snippet);

        chrome.tabs.executeScript({
            code: runCodeWrapper(req.snippet)
        });

        sendResp();
    });
})();
