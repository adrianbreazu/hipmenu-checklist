var orders = [];

document.addEventListener('DOMContentLoaded', function() {

    // get orders from page
    chrome.tabs.executeScript(null, {
        code: "\
            var orders = [];\
            if (document.location.hash.indexOf('#history') == -1) {\
                var my_name = document.querySelector('#h-profilename').textContent;\
                var name_tags = Array.prototype.slice.call(document.querySelectorAll('.container-white-rounded .header-left p'));\
                var price_tags = Array.prototype.slice.call(document.querySelectorAll('.container-white-rounded .summary-total .value'));\
                if (name_tags.length > price_tags.length) {\
                    name_tags.splice(0, 1);\
                }\
                for (var i = 0; i < name_tags.length; i++) {\
                    orders.push({\
                        name: name_tags[i].textContent.replace('Selecțiile mele', my_name).trim(),\
                        price: price_tags[i].textContent.trim(),\
                    });\
                }\
            } else {\
                var order_tags = document.querySelectorAll('.history-diners .container-marginTBMedium');\
                for (var i = 0; i < order_tags.length; i++) {\
                    var tds = order_tags[i].querySelectorAll('footer td');\
                    orders.push({\
                        name: order_tags[i].querySelector('h4').textContent.trim(),\
                        price: tds[tds.length - 1].textContent.trim(),\
                    });\
                }\
            }\
            JSON.stringify(orders);\
        "
    }, function(orders) {

        // build the orders object
        orders = JSON.parse(orders);
        orders.sort(function(a, b) {
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });

        // render the checklist
        var html = '';
        for (var i = 0; i < orders.length; i++) {
            html = html + '<tr>';
            html = html + '<td><label for="check' + i + '">' + orders[i].name + '</label></td>';
            html = html + '<td><label for="check' + i + '">' + orders[i].price + '</label></td>';
            html = html + '<td><input id="check' + i + '" type="checkbox" data-name="' + orders[i].name + '"></td>';
            html = html + '</tr>';
        }
        document.querySelector('tbody').innerHTML = html;

        // add event listeners
        var checks = document.querySelectorAll('td input');
        for (var i = 0; i < checks.length; i++) {
            checks[i].addEventListener('click', function(event) {
                var name = this.getAttribute('data-name');
                for (var j = 0; j < orders.length; j++) {
                    if (orders[j].name == name) {
                        chrome.tabs.executeScript(null, {
                            code: "sessionStorage.setItem('" + name + "', " + this.checked + ")"
                        });
                        syncState();
                    }
                }
            });
        }

        // get checkbox statuses from parent page
        function syncState() {
            var total = 0;
            for (var i = 0; i < orders.length; i++) {
                chrome.tabs.executeScript(null, {
                    code: i.toString() + " + ':' + sessionStorage.getItem('" + orders[i].name + "')"
                }, function(data) {
                    data = data[0].split(':');
                    var index = parseInt(data[0]);
                    var value = (data[1] == 'true' ? true : false);
                    document.querySelector('input[data-name="' + orders[index].name + '"]').checked = value;
                    total = total + (value ? parseFloat(orders[index].price) : 0);
                    document.querySelector('tfoot').innerHTML = '<tr class="brand"><td>Total adunat:</td><td colspan="2">' + total.toFixed(2) + '</td></tr>';
                });
            }
        }

        syncState();

    });
});
