$(function() {

    var $form = $('form'),
        $textarea = $('textarea'),
        rawcsv,
        csv;

    if (!String.prototype.trim) {
        String.prototype.trim = function() {
            return this.toString().replace(/^\s+|\s+$/g, '');
        };
    }

    $('form').on('submit', function(e) {
        e.preventDefault();
        rawcsv = $textarea.val();

        // csv = rawcsv.replace(/\n/g, '< ␤ >').split('< ␤ >');
        csv = new CSV(rawcsv, {
            header: true
        }).parse();

        // turn session count into int
        csv = _.map(csv, function(row) {
            if (row.Sessions) {
                row.Sessions = parseInt(row.Sessions.replace(/,/g, ''), 10);
                return row;
            } else {
                return false;
            }
        });

        // whittle out bad items
        csv = _.reject(csv, function(o) {
            return !o;
        });

        var sumSessions = _.reduce(_.pluck(csv, 'Sessions'), function(sum, num) {
            if (typeof num == 'number') {
                sum += num;
            }
            return sum;
        });

        // add weight & break up dimensions
        csv = _.map(csv, function(row) {
            if (row.Sessions) {
                row.weight = (Math.floor(row.Sessions * (100 / sumSessions)) / 50) + 0.25;
            }
            if (row['Screen Resolution']) {
                row.width = parseInt(row['Screen Resolution'].split('x')[0], 10);
                row.height = parseInt(row['Screen Resolution'].split('x')[1], 10);
            }
            return row;
        });

        draw(csv);

    });

    function draw(csv) {

        var cx, cy;

        s = Snap('.svg-container');
        s.clear();

        svgWidth = s.node.offsetWidth;
        svgHeight = s.node.offsetHeight;

        // sort widest first.. handy for when we roll over with mouse...
        csv = _.sortBy(csv, 'width');
        csv = csv.sort(function(a, b) {
            if (a.width < b.width) return 1;
            if (b.width < a.width) return -1;
            return 0;
        });

        // console.log(_.pluck(csv, 'Screen Resolution'));
        // console.log(_.pluck(csv, 'weight'));
        // console.log(_.pluck(csv, 'width'));
        // console.log(_.max(csv, 'width').width, _.max(csv, 'height').height);
        // console.log(_.min(csv, 'width').width, _.min(csv, 'height').height);

        minWidth = _.min(csv, 'width').width;
        maxWidth = _.max(csv, 'width').width;
        minHeight = _.min(csv, 'height').height;
        maxHeight = _.max(csv, 'height').height;

        _.each(csv, function(o) {
            if (!o['Sessions'] || !o['Screen Resolution'] || !o.width) {
                // bad row
                return;
            }

            cx = 0;
            cy = (100 - ((o.height * 2 / 100) / (100 / svgHeight)) / 2) + '%';
            boxWidthPc = o.width / maxWidth * 100 + '%';

            box = s.rect(cx, cy, boxWidthPc, (o.height / 100) / (100 / svgHeight) + '%').attr({
                fill: "transparent",
                stroke: 'rgb(81, 116, 234)',
                strokeOpacity: o.weight,
                // strokeOpacity: o.weight + 0.1,
                strokeWidth: 5,
                'data-weight': o.weight,
                'data-width': o.width,
                'data-height': o.height,
                title: o.width + 'x' + o.height + ', count: ' + numeral(o.Sessions).format()
            }).hover(function() {
                this.attr({
                    stroke: 'red',
                    strokeOpacity: 1
                });
                $(".js-tip").html(this.attr('title'));
                $(".js-tip").show();

            }, function() {
                this.attr({
                    stroke: 'rgb(81, 116, 234)',
                    strokeOpacity: o.weight
                });
                $(".js-tip").html('&nbsp;');
            });

        });

    }

    console.log('ready');

});