document.addEventListener('DOMContentLoaded', function() {
    const paragraphs = document.querySelectorAll('.apology p');

    paragraphs.forEach((p, index) => {
        p.style.opacity = '0';
        p.style.transform = 'translateY(20px)';
        p.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

        setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
        }, 300 * (index + 1));
    });

    const emphasisBox = document.querySelector('.emphasis');
    if (emphasisBox) {
        emphasisBox.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.3s ease';
        });

        emphasisBox.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function generatePositions(startMin, startMax, smallGapMin, smallGapMax, bigGapMin, bigGapMax) {
        const positions = [];
        let y = randomBetween(startMin, startMax);

        while (y < 95) {
            positions.push(y);

            // Creates occasional mini-clusters (e.g. 2 close, then a larger gap)
            if (Math.random() < 0.35) {
                y += randomBetween(smallGapMin, smallGapMax);
                if (y < 95) {
                    positions.push(y);
                }
            }

            y += randomBetween(bigGapMin, bigGapMax);
        }

        return positions;
    }

    function addRandomEdgeDecor(target, symbol, itemClass, options) {
        if (!target) return;

        target.querySelectorAll(`.edge-decor-rail.${itemClass}`).forEach((node) => node.remove());

        ['left', 'right'].forEach((side) => {
            const rail = document.createElement('span');
            rail.className = `edge-decor-rail ${itemClass} ${side}`;

            const positions = options.positions || generatePositions(
                options.startMin,
                options.startMax,
                options.smallGapMin,
                options.smallGapMax,
                options.bigGapMin,
                options.bigGapMax
            );

            positions.forEach((topPercent) => {
                const item = document.createElement('span');
                item.className = `edge-decor-item ${itemClass}`;
                item.textContent = symbol;
                item.style.top = `${topPercent}%`;

                const tilt = randomBetween(options.minTilt, options.maxTilt);
                const inwardTilt = side === 'left' ? tilt : -tilt;
                const sway = randomBetween(-6, 6);
                const sizeJitter = randomBetween(0.93, 1.08);

                item.style.setProperty('--decor-rotation', `${inwardTilt + sway}deg`);
                item.style.setProperty('--decor-scale', String(sizeJitter));
                item.style.opacity = String(randomBetween(0.88, 1));

                rail.appendChild(item);
            });

            target.appendChild(rail);
        });
    }

    document.querySelectorAll('.container').forEach((container) => {
        const sharedPositions = generatePositions(
            4,
            11,
            4,
            7,
            14,
            24
        );
        addRandomEdgeDecor(container, '\uD83C\uDF3B', 'sunflower', {
            positions: sharedPositions,
            minTilt: 8,
            maxTilt: 24
        });
    });
});
