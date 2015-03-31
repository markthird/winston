var App = React.createClass({

    getInitialState: function() {
        return {
            results: [],
            selectedIndex: 0
        };
    },

    componentDidMount: function() {
        var app = this;
        var searchInput = this.refs.searchBox.getDOMNode();

        // register packages
        this.packages = [new Core(searchInput)];
        var packages = ['calculator', 'tabs', 'bookmarks', 'pinterest', 'salesforce', 'youtube', 'history', 'google'];
        var optionPackageMap = {
            'bookmarks': Bookmarks,
            'calculator': Calculator,
            'google': Google,
            'history': History,
            'pinterest': Pinterest,
            'salesforce': Salesforce,
            'tabs': Tabs,
            'youtube': Youtube
        };
        chrome.storage.local.get(packages, function(options) {
            packages.forEach(function (name) {
                if (options[name] == true) {
                    app.packages.push(new optionPackageMap[name](searchInput));
                }
            });
        });
    },

    render: function() {
        return <div onKeyDown={this.keyDownHandler} onMouseOver={this.hoverHandler}>
            <SearchBox changeHandler={this.triggerInputHandlers} ref="searchBox" />
            <ResultsList clickHandler={this.runSelected} data={this.state.results} selectedIndex={this.state.selectedIndex} ref="resultsList" />
        </div>;
    },

    keyDownHandler: function (e) {
        switch (e.which) {
            case 40:
                e.preventDefault();
                this.selectNext();
                break;
            case 38:
                e.preventDefault();
                this.selectPrevious();
                break;
            case 13:
                e.preventDefault();
                this.runSelected();
                break;
        }
    },

    hoverHandler: function (e) {
        var closest = function (node, className) {
            while (node) {
                if (node.classList.contains('result')) {
                    return node;
                } else {
                    node = node.parentElement;
                }
            }
            return false;
        };
        var result = closest(e.target, 'result');
        if (result) {
            var i = Array.prototype.indexOf.call(result.parentNode.children, result);
            this.setState({ selectedIndex: i });
        }
    },

    selectNext: function () {
        var last = this.state.results.length - 1;
        var i = this.state.selectedIndex;
        if (i < last) {
            // update selected index
            i = i + 1;
            this.setState({ selectedIndex: i });
            // update scroll position of resultsList
            this.refs.resultsList.getDOMNode().childNodes[i].scrollIntoViewIfNeeded(false);
        }
    },

    selectPrevious: function () {
        var i = this.state.selectedIndex;
        if (i > 0) {
            // update selected index
            i = i - 1;
            this.setState({ selectedIndex: i });
            // update scroll position of resultsList
            var resultsNode = this.refs.resultsList.getDOMNode();
            var selectedNode = resultsNode.childNodes[i];
            if (resultsNode.scrollTop > selectedNode.offsetTop)
                resultsNode.scrollTop = selectedNode.offsetTop;
        }
    },

    runSelected: function () {
        var selectedCommand = this.state.results[this.state.selectedIndex];
        return selectedCommand.run();
    },

    triggerInputHandlers: function (e) {
        var app = this;

        // execute all package inputHandlers side by side
        // and build array of the returned promises
        var promises = [];
        this.packages.forEach(function (package) {
            promises.push(package.inputHandler());
        });

        // when all promises are fulfilled
        Promise.settle(promises)

        // combine package commands together
        .then(function (results) {
            var commands = [];
            results.forEach(function (result) {
                if (result.isFulfilled()) {
                    commands = commands.concat(result.value());
                }
            });
            return commands;
        })

        // update react state
        .then(function (commands) {
            app.setState({
                results: commands,
                selectedIndex: 0
            });
        })

        // error handler
        .catch(function (error) {
            console.error(error);
        });
    },

    debounce: function (func, wait, immediate) {
    	var timeout;
    	return function() {
    		var context = this, args = arguments;
    		var later = function() {
    			timeout = null;
    			if (!immediate) func.apply(context, args);
    		};
    		var callNow = immediate && !timeout;
    		clearTimeout(timeout);
    		timeout = setTimeout(later, wait);
    		if (callNow) func.apply(context, args);
    	};
    }
});
