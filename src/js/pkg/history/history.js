(function (Winston) {
    var storageKey = 'historyItems';

    var History = function () {
        var history = this;
        this.items = [];

        Winston.Storage.get(storageKey).then(function (historyItems) {
            history.items = historyItems;
        });
    };

    History.prototype.optionChangeHandler = function (e) {
        Winston.Storage.set(e.target.name, e.target.checked);

        if (!e.target.checked) {
            Winston.fetchData();
        } else {
            Winston.Storage.set(storageKey, []);
        }
    };

    History.fetchData = function () {
        Winston.Storage.get('history-items-count').then(function (count) {
            chrome.history.search({
                text: '',
                maxResults: parseInt(count)
            }, function (newHistoryItems) {
                return Winston.Storage.set(storageKey, newHistoryItems);
            });
        });
    };

    History.prototype.inputHandler = function (e) {
        var input = e.target.value;
        var commands = [];

        if (input.length > 0) {
            this.items.forEach(function (item, i) {
                if (item.title.toLowerCase().indexOf(input.toLowerCase()) > -1 || item.url.toLowerCase().indexOf(input.toLowerCase()) > -1) {
                    commands.push(new HistoryCommand(item, i));
                }
            });

            if ('history'.indexOf(input.toLowerCase()) === 0) {
                commands.push(new AllHistoryCommand());
            }
        }

        return commands;
    };

    var HistoryCommand = function (history, i) {
        this.id = 'HISTORY' + i;
        this.icon = 'history';
        this.title = history.title || history.url;
        this.url = history.url;
        this.description = this.url;
        this.action = 'Open History';
    };

    HistoryCommand.prototype.run = function () {
        chrome.tabs.create({ url: this.url });
    };

    var AllHistoryCommand = function () {
        this.id = 'ALLHISTORY';
        this.icon = 'history';
        this.title = 'Open History';
        this.url = 'chrome://history';
        this.description = 'Open all history in new tab';
        this.action = 'Open History';
    };

    AllHistoryCommand.prototype.run = function () {
        chrome.tabs.create({ url: this.url });
    };

    Winston.Package.register('History', History);
})(Winston);
