'use strict';
/**
 *
 * @module behaviors\base
 * @description
this is the base class for creating behaviors.  a behavior can be thought of as a model++.
it contains all code/data that's necessary for easily implementing a virtual data source and it's manipulation/analytics
 *
 */
(function() {

    var noop = function() {};

    var merge = function(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    };

    var imageCache = {};


    // create these images with http://www.base64-image.de/
    var imgData = [
        ['1-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAFFJREFUKFNjQAL/oTTD////CWJkgFMjEAgD8Q4gLkMSgwOsGoGgDCQExcRrRFJImo1ICqmnEUSiYJgkMgYCrDYia8TQBFVIJ6cCAXJ0QDGDDQD67OYX9wdp0wAAAABJRU5ErkJggg=='],
        ['1-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAExJREFUKFPtjYEJACAIBN2hdZqr2dqu3tB8C5qghzPxlAQZJ4iWJ9E8DpACOmh7ZkLLwoWDNPJxSMONSwa5fzSBJy8z/9B6RpfVZaRO2oo/zJVRDvIAAAAASUVORK5CYII='],
        ['1-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGtJREFUKFOtjoEJgDAQA6uiC7iOc3U2t3sT6Uu+XxDBwFliEtoisnYWM3vFtQG6mWZQ2sEJqvy7tQC6FUzdqLaMpCH1OB1KcXgjBZ8HDhSHEuCIZeW/IcRvwEMFyjey7HjQA317KsvMIuW4AFTUEgvs+3wkAAAAAElFTkSuQmCC'],
        ['1-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAFBJREFUKFPtjdsNQCEIQ93BdZzL2dwOjw9CuV93AEmOJbYNxcw2DHL2P5wHcdR0mAoDuvxFyXHzBrp4UZQAEoUvTL4oBpLDyiveXVnh5WVKm6iPR8RbHxLhAAAAAElFTkSuQmCC'],

        ['2-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAH5JREFUKFOVkAsNgDAMROcBBxjAAEJwgAMcYGGmsIAGLJS7piE3FjJ2yRvpxus+SWLxTWbWRFOJyAgyuDgNDjD9EWewAzZgvElTVCJshLJfXED3jjwu77pG7UKBCvHTAPgwWeY8Kn5KLN4i81SyyOOdgHfzqMixQBb9FWvSdgNN871AHwblVAAAAABJRU5ErkJggg=='],
        ['2-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFN9kAEVgzAMRPEwBzOAgQnBwRzgYBZqCgtowAL7l6VtILB77zc01yttB7SfQRr+0j8uAugJBTb5sMBoni/QYNSQ91/wAW0g2Sbu9VAlhisubcSUeTCscYdrgt8fg0HJgQrScXXXt82DQckBgR6ghymtF0zKMSBQC2nS+mEBJYV0vBV0N1PzwiJKCtorZob5Cy2RFvXFQAKlAAAAAElFTkSuQmCC'],
        ['2-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkAsNAjEQRAsXMIADDJwBhOAABzjAwpnCAhqwUN4s2zJQCJO8bGa3018x1ayl1vqXpi3IrWVsuIcF7mrDFWYPTiC3gZUFD3ABbSDFJh6UumtBJ6WNsB/BtugbqSM8T7QBZQw0kK6rt57C24AyBgTagT5msV687Y02zAU9JNP7OfwV0vVuoLeF+swWUV6h7MUvjpTzA6fM6SVV2CbgAAAAAElFTkSuQmCC'],
        ['2-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAIxJREFUKFOVkFsRgDAMBOsBBxjAAEJwgAMcYAFTWEADFspe+iDQH8jMcrSX6yvEGA0KSf9fSB+k8DBD6GGDUx7sMGTvDhVccIQVtIDKFjHPNSH3bm9yaSGG/4MT/N5Rx9VdZxs7A2kDgupAD7PVOWciz4CgakiDOu8akCak4x2gu1lVzzUhTdBesSUsF/uHHu110bZRAAAAAElFTkSuQmCC'],

        ['3-abs-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJVJREFUKFONkQENhDAMRecBB2cAAyhAwTnAAQ6wgAa8nIXTcBbGf6NduiyEe8ljadlfOkiBbGvKOT8a6YLiJXf5oy2/8v1PcJKb5ABYJS+8LnTBqMFBFGOpjKfgIBl7t7pyGxQ+InecPcizMYZ8kzFLGnXUGLwLOTS5a6XuCqFFMib3A2p+Tfmq7GgMQU4+vC8/Vy+lEzGdowwHiWM2AAAAAElFTkSuQmCC'],
        ['3-abs-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAJtJREFUKFOFkQERwjAMResBBzOAgSmYAhzgAAdYmAa8YAENWID3SgM5soN/95om6e+lW0OPb5DLTz6bDQOaYIW7fbjBoffGAZdOmEZ9hjN4gTqBjZ6/TUE2B0NeZLLPDUI1BGgHjr32PDUI1SAoRvSNS6+lJqGaJGkBC/9H3ZDFOR8gFNMRHNP3KXN/zZQPEYrRr3ixN7i+aq09ARE7/LLO8L26AAAAAElFTkSuQmCC'],
        ['3-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAKdJREFUKFN1kQERwjAMRQscGMDBDGBgCqYABzjAARamAS9YQAMWyn8hodlt/Xfv0p80uXQrSdXjX7XWLqGTwO3NNQ1iFh9B/S2uufEgcEexI+EaxUMwAN0F98Kb2hjXxmoMwlzMuVRfviMjnQVrz+ZTQWHdAFKsyBsny6WiwroJkiZBwlblsKDTFCI5RrHXdBOsyfsQnl8z5EsKrclzfMUnNef1y5XyBYgdtwl+Lm+LAAAAAElFTkSuQmCC'],
        ['3-up', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAAJpJREFUKFONkQsRwjAQBeMBBzWAgSqoAhzgAAdYqAa8YAENWAi7+cAx6UDfzPaae32ZS5pyzgVEqe97qA9K58tMaYIVnnrwgFPzPqFOCM5wBTdQF9CY4u7vwBZNbuTiGA3KGOigAzj2WtbBoIwBQX1Ez7iUXjApY0iCFrDxf9QN2ZzjB5QhdAbH9HzKtb/m960ib/Gm17jXXkov3zEEuQ7h10oAAAAASUVORK5CYII='],

        ['back', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAABUUlEQVQ4EWNgGLQgZY12e9oa/S/YHIgsx4JNQdwirXaG/4zljEyMjOjy6HJM6ArCJmr0CQjyVBgr2DH++fMXRRqbHIoLfOpU5nELMyfKCasy/Pv/h+H3d4QBuOTgLnDIkl/CI8aSqCCtyPDmywuGb78+Mfz6+g/sAnxyYBdYREs/4pNklRVX4Gd49u4Jw////xk4WTkZfn35x4BPDmQ62AW/f/y/+Pvbf4YfP38y/Prxh+HX9z8MX359ZvgJdAE+ObgBZ98+C3xx7dva+8c/MTCzMTL8+/ef4fvPbww/P/1hwCcHN4DhAMOf8xufh7y8/m3Vw2NfGFjYmRi+//gBDMT/DHjlgCagxMLFrS/C9f5I/Pz393+srCk3PBBBNuGSQzEApPDSzhdxmn8k/v37yxD/+wckFkDiIIBPDqICidR0EJ2t7y0J9AMmwCeHqZrWIgAZ4PYDxftGYgAAAABJRU5ErkJggg=='],
        ['expand', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAQ9JREFUOE9jcIoq/Y+MgYCBFAw2AMahmQEK7UL/kTGyHFFeAGkKOmoLxhgGIHNwYZCm0JMOYIzVACCAC2JzEUhTxFlnMCboAmRvIBsQc8kNjPG6AETjMiD+micYE+UCZAwSA2lKvuUDxnhdgIwLNqWDFcNw+n1/MEYWK9iYjqoJhGE2O8QU/FdplPsfesL+f9bjIBQMErOaqgtUjuYCEA1zNghbpyT815wgBbY570Xo/9znof/T7vn/V++X+N93sB2iB6YYhpENALFBCs2XqP0veB0OxiA2TDMIo2gGYZgXYBgkFrjQ7X/AAWsIXuAKFoNhFM34sN5Ehf8g/Pj9QyAXIY6iCB8GORvZ6RD8nwEA/ZSbmLCRhEoAAAAASUVORK5CYII='],
        ['forth', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAB3RJTUUH1wkbCxU7wwzUCQAAAAlwSFlzAAAewQAAHsEBw2lUUwAAAARnQU1BAACxjwv8YQUAAACcUExURQAAADhUH3CvOHa3O2igNDZRHl2OLzhUHztYIFF7Kj5dIUBgIkNlJEhtJXi4Pna2Oz1cIUNlJEhtJk94KVF8KlN/K1SBK1WCLFaELVqJLlyOL1+SMGOYMmmiNGmjNG+sN2+tN3GvOHKwOHKxOXOzOXS0OnS1OnW2O3e3PXi4Pn28RH+9RoC+R4bCUInDVJHHXpvMa5zNbqTReabSfVhfgkQAAAAQdFJOUwAEh4eOm56goqSprLPi9P64yPeoAAAAZklEQVQY043FRwKCMAAAwUVAqVYUpAjYY6P9/29eAuSmcxn4ba6rAWIxUQIu3dMYA/K2OU6HgEP9qTK7D0iru3glvgyI3+VJ7D0ZsHsUt8jVZMDmeg6dIWBdbq0xYBXMlIClqfaHL3HSC6GZKibEAAAAAElFTkSuQmCC'],
        ['up', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAABVUlEQVQ4EWNgoDWouVD5H58dTPgkHU7o/D/9YzM+JbjldLdI/T/6f8r/Bf8T/quvlsLpCkZsRqgtlPo/La6K4dSfLQzfv/1k4ORiZ1iw7BLDrfhnGOoxBCCaC4GajzF8+PYBbj47kLVy+Q2GWxnPUfSghIHhQlWgzYUMTxjuAm2GaP4PdAEI/wDi8EgNBu0Z8ijegZtmsdD4/8vvtxlYuVgZFNWEGOyNdcAuAGn+DrT9yPL7DO+/fwW7SJBTluFC0VWwXhaYG0/En4Ubxr2a57+yuSbD4W8HwNKcQPLL918MD6s/gdU8ZLgK08aA4gW46LffDN9/A+39+hOMQS5ghUuiMrAbAFbzneEHkAZhkEG/wAywBAqB1YBf3/8DAxGHDhTtDAzwMEAWZ+NkZPjO/YOBA+R2EACGHRsHhIlOYjXg8akvDBPvbGP4BTTgP8wQdJ2Dhg8A9SSD4ETIHK4AAAAASUVORK5CYII='],
        ['down', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAABV0lEQVQ4EWNgGGjAiM0BItl8/7mFGBh+fWdg+A/EMPBi6icM9SwwSWRa1oyHITbKjuHem9sQ4a8MDHtXPmB4gawIysZqwK/v/xk4v3Iw/ABqBAEOIP71A8zEIJgwRIACbJyMDJxcIG2EAVYXQLRxgm0Gs7nZGdhwmIfdAC5WBk5WTgYGoEYQALIYfoNZmATcAIuFxv9ffr/NwArULCbLxnD3z3UGLi52hv/ffjKAIoKHk41BvpXvP8gIQU5ZhgtFV8ExghIthgtV/3fHpTE8YbjLcPfTTYafQMUgA2CAA2jguuX3GK5mPITrgzNgitQWSv2fFlfIcOrPMYYP3z7AhBlAnlm5/AbDrYznKHowYuFW/DPGrEX9DGYszgwCQBtBGkH0yg03MTTDTcfG0N0i9f/o/yn/F/xP+K++Wgrsd2zq8Io5nND57w7EeBURkqy5UEmZAYQsAADbOWDTAxBmkQAAAABJRU5ErkJggg=='],
        ['pause', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAB3klEQVQ4jX2Tz0sbURzE3wY8xH+j3i1evBSrUhpRQUwURfxZIirEEiF4k1iqYC/VFjwI4smYlBaClqIHqTFojKmmZq2godgWvejBQgV/RqZvNuERYtYHA8PM7Of0XSH4LFIeKZ/UXEb0rx7IC0XWK5XyC6vm14KWgHZlyG8JSlnlRzm5ls5rswFlBr3bFq7Ez9QW/qR+oCZsAzOqJlwlsz3ZbYMbI7fnAvxiyK33IHm3gV93OxjU3ZCZl6L/LTN2br2X+ZBwZAOepgEv9W7s3YaQTEXh0fvTgIDw0idTm7JbBTcGoCEPwJXoQvx6EbvXXzGQ6FMA+t2bFaNzJV6YA3q/t2H94iNilwvo33EqAH3s8jMiF5/AjSnAGW/G8r8ZhM5n0RdvVwD60LnP6LgxBXRu2TF/No4vfyfh3G5WAHpm82cT4MYU0Bqrhe/Ei8DJCDq+1SsA/YfTUdkNgxtTQFP0OaaO3Jg+9qAlWq0A9MzYcXMfkLkDR6Qcbw87MXHoRGPkmboDembsHJGKPHeQAdStPcHrAztGDxpRv1amAPTM2HGTHyDPs3jpEcb22/Bmvx2Pl4rUKdMzY8fN/VMuMQBWSQ5qAXFF0fMHM81tIud1SL2Tep8RveuBvCD92X9NeXkWOHF72gAAAABJRU5ErkJggg=='],
        ['play', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAANjr9RwUqgAAACBjSFJNAACHDwAAjA0AAPmTAACE5QAAe4IAAOt1AAA/tAAAIlh1a16cAAAD8GlDQ1BJQ0MgUHJvZmlsZQAASMeNVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXhLu7iPAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAAGHRFWHRTb2Z0d2FyZQBwYWludC5uZXQgNC4wLjVlhTJlAAABPElEQVQ4T2MAgaoTYuJgBrmg+rhcXupCmf9Fe2TDoUKkgYpDChkgA+pOKf4v2il3qWC3pCZUijhQBjUg6Kjt/9CTDv+rDiv8z9skuzRhPgMHVAl+ULwX1YCIs87/Yy65/S/erfA/Z71MGVQZblC4SxarAfHXPP8n3/IBukbudfY6KVeockxQuBm/Aen3/f9nPQ76n7VK+nDGKmFpqDYEyNlInAG5z0P/F7wO/5+5VHomSvjkrJQmyYDURdJbY3eKc0O1MzCkLyfOgKT50rdSl0obQLUhANBEvAakLJD+mTRbIg6qHBMATcZqQMoimf+x0yX7oMpwg4RZkigGgNgxkyX3J0wVlYAqwQ8SZkAMSFsi8z96otSz2EkS9lAp4kDcNKncuKlS/8N7JPOhQqSB6ElCMm4lSNFCNGBgAAAY+v7rj5j+SgAAAABJRU5ErkJggg=='],
        ['swap', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAI9SURBVDjLpZNBS9RhEMZ/u60aZAdNSXdLrcxNS82DaRQVRBCUGngwwkOnvkB0yEt0qy/QKSrq5DUSQgLTSi01d80gcrXSTTdTViTU//+ded8ORihFYD4wl+FhYOY3T8A5x2YU3Ij54qOmp833zmX+14CWh431vm9OGs+8W9sPXOm49HsHqxarFhXbZ9W2EQxeECNnxUh0W2Y2kdwIcwtzJCbHY8+uvagBCAG0Vl3G4XDOYZ1jbPbj0ffJ0S6xQrT4AFszsxC1qFPycvJYXl45fOxG7ctXNweOB51zWBzW2V+l7MnbS21JLemFNBmhDIwIxhqMGowKxgjGNxkAISuWB2/uoqIE7Rb255dxMHKInO07CLkMxpMTpOZnmE7NEN4ZQUVITIyPDNyK1wEE1mJsud+QLUavl4cr2o5E64glhumJ9ag629TV1ttRd7VGNWQ/Dd6Ol/6VgguCDTjiYzGWvCWiReX4Pwxe2gPAX/Lx5rx1dAKt7c1OjCBGcOIoyC1kMb1IWTjKvqJSJqbGGR6Nk0gkOBitQMQyNDg0kmj/XA0QMr7hRPkp1ClqBbHKXNY88Q9xineVEC6IUFgQwZ62qFUsFm/Fq9p9Pvx66sl0XdD46y8sKiwuLZL6/o3nvd3Mp+cRJ4gVxCliFRFFjBqAQMOdM06MYHxB/FVEYqRPPG3z0/7qI/kazc/Pp7K6kuSXJEP9b2MznbM1f1D4l4oaI/Uq2qViJ1Ods9ENZ2Hy8dd+NdqtRivXUdhsnH8Cn6RstCM01H4AAAAASUVORK5CYII='],
        ['collapse', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAPNJREFUOE9jcIoq/Y+MGXCACUc6/4MwlIsAyJrwGaA3UeE/CEO5CECMAYEL3f4HHLCG4AWuqGpAmpAxVBgOQM42X6L2v+B1OBiD2H0H27FahAFAmjUnSP1Pv+//P/d5KBin3fP/r94vgREecA6ya/Q7lf+HnrD/n/U4CAWDxKym6mJ3BcwbhZsz/iu0C8ExyBUgjCxWsDEdbgiMgRIOMDZIcfItHzAGscGSuADM+TAMEgNpir/mCca4DMBrKkhTzCU3MCbbBRFnncGYkAvgmkAA2YDQkw5gTJQLoEwUA4KO2oIxUQYgY5AYSBMyBiscJICBAQCpROGZ6kqHfwAAAABJRU5ErkJggg=='],
        ['reset', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAL8SURBVDhPbZLZTxNRFMbnDzD65BsurC2tSFlENiG4EARBguzIGkBDwKAsIqA+EAIE45JgogaCxrdqgiQmxhAVjWIEpEioChRKUGmZTpeZaSlQ6OedoVYxnOSXe893vnPvzcml/o+V4WGJrbOmgm+tVLJN+UqeYL1Zp+TbLpy1qz7ud9m2D+u9tjq+qYTmLmbZuUvZIOsmNTnCauOvlWuX77dHuux/wzQ6sIvrbOziKrPBlqa64ZsrwF8u26Jxl4pg7WppxuSbHa52iuJry9rZgtOwZCdsUpgKC8nXtRqsDQ2SxgxY8pPddZbU2drSarHZdqsjxXTqqNl8MhYCXEkO1j59AFeeD6fFDMcXFazkQseECmxBuugROZMwtXKrQ0KxRdl95mPRMMdFgi3KxYZuEWtjn2FJT4HTTA4YHwN7rgTr8/PkkHFYUhNFrzkhjryssIgyRkWOmYKDYAoLxUr/MziNRmI6DUFzmkxwjI6Ie0tWJpwMA+5KA0whwaJmSkrqpgwSuZqRyGAMjyY3q2BXPgEjkRNkZAZarL56Le4FbfXlAGw9vTAGKETNKA1QUkxolJX28IEhOAJr4xOwPeiBkAswMSfAhMe6c/vTPtgePgbtLRdzY0o6Tem85WrdHl/opYFYffeevGIc+n1+ELR/ETTHt+/gWjug85SKGq0IU1K/5CFvf+71gwDXcQNO+wrMDVfF/F+4ztvYIPMxZOS6taX45BZKn5Z1d8HLf32BCAv+Clifv8A6TYO9cxd0TiEMBaWwkadvsBzY7l4s+MgheH/Igux0Wk4ixdTXe8wdDBvS7JdCYE4WDH1tA5aHR+AwMHDo9eDJ8HTnqzArVYgeAW1QhJKpur5T/EyWnkfHZ8mwpkhBYNpLhpkDIdAoDovMyIIw5envrs8eIcN90BsuNv+JxZor6dOHorWTPnKnmgxpO776HnBoYuJVS7e7ol1tW2O++JxsNiOvcTIkYlBNbp7w8seEtwzfImKhDjzUr8nMq14srtrtspOgqN9wa0YvcwzUuQAAAABJRU5ErkJggg=='],

        ['rectangle-spacer', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAA1JREFUGFdjGHSAgQEAAJQAAY8LvLEAAAAASUVORK5CYII='],
        ['add-column', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAPVJREFUOE9jUKtncAbi/0RgZwZsACQBUlDwOhwrJtqA3OehyIrBGE0MvwFZj4OwYqjmc9rN7Ft1mtknQ9WLQLUjDEi/749sGxiDxLSb2N6giwMNOwOkIYYAGTjDQLOR5RNME0wMxgcafAxIi+AMA3Q+ugFQ7Iw3DEDiMI3oGMMA9DCA8bFpBmGoOoQBybd8MDBUEYpByGJAjDAg/poniiSIDwzErzA+ugHazWwngDQiEGMuuWHFWk2sH2CaYBiYHs4BadRojDjrjKIITew8UNNO3RbOWUB2LRBjJqTQkw5YMUgOivEn5aCjtlgx0QYQgbEYwMAAAEqqlSGCjw+bAAAAAElFTkSuQmCC'],

        ['up-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTFH80I3AAAAHklEQVQYV2PAAv5DaZwApACGsQJkBVgVYlMAxQwMABOrD/GvP+EWAAAAAElFTkSuQmCC'],
        ['down-rectangle', 'iVBORw0KGgoAAAANSUhEUgAAAAkAAAAECAYAAABcDxXOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjExR/NCNwAAABpJREFUGFdjgIL/eDAKIKgABggqgAE0BQwMAPTlD/Fpi0JfAAAAAElFTkSuQmCC'],
        ['sortable', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAKCAYAAACE2W/HAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAAxSURBVChTY8AD/kNpkgBIEwwTDZA1Ea0ZmyYYHmQAmxNhmCAgSxMMkKUJBvBoYmAAAJCXH+FU1T8+AAAAAElFTkSuQmCC'],
        ['empty', 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAANSURBVBhXY/j//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC'],
        ['filter-off', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAAAUElEQVQ4EWNgGAWMKEHQ8P8/Ch8Xp4ERVR+KOnyG4JMjaAgOzUwoGqnKQbYRmU2SJUCNIMCAxwCCXmAEAnyWEjQAn2aQHGED8DifkOFDRB4AqksdeGc+mTIAAAAASUVORK5CYII='],
        ['filter-on', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAD8GlDQ1BJQ0MgUHJvZmlsZQAAOI2NVd1v21QUP4lvXKQWP6Cxjg4Vi69VU1u5GxqtxgZJk6XpQhq5zdgqpMl1bhpT1za2021Vn/YCbwz4A4CyBx6QeEIaDMT2su0BtElTQRXVJKQ9dNpAaJP2gqpwrq9Tu13GuJGvfznndz7v0TVAx1ea45hJGWDe8l01n5GPn5iWO1YhCc9BJ/RAp6Z7TrpcLgIuxoVH1sNfIcHeNwfa6/9zdVappwMknkJsVz19HvFpgJSpO64PIN5G+fAp30Hc8TziHS4miFhheJbjLMMzHB8POFPqKGKWi6TXtSriJcT9MzH5bAzzHIK1I08t6hq6zHpRdu2aYdJYuk9Q/881bzZa8Xrx6fLmJo/iu4/VXnfH1BB/rmu5ScQvI77m+BkmfxXxvcZcJY14L0DymZp7pML5yTcW61PvIN6JuGr4halQvmjNlCa4bXJ5zj6qhpxrujeKPYMXEd+q00KR5yNAlWZzrF+Ie+uNsdC/MO4tTOZafhbroyXuR3Df08bLiHsQf+ja6gTPWVimZl7l/oUrjl8OcxDWLbNU5D6JRL2gxkDu16fGuC054OMhclsyXTOOFEL+kmMGs4i5kfNuQ62EnBuam8tzP+Q+tSqhz9SuqpZlvR1EfBiOJTSgYMMM7jpYsAEyqJCHDL4dcFFTAwNMlFDUUpQYiadhDmXteeWAw3HEmA2s15k1RmnP4RHuhBybdBOF7MfnICmSQ2SYjIBM3iRvkcMki9IRcnDTthyLz2Ld2fTzPjTQK+Mdg8y5nkZfFO+se9LQr3/09xZr+5GcaSufeAfAww60mAPx+q8u/bAr8rFCLrx7s+vqEkw8qb+p26n11Aruq6m1iJH6PbWGv1VIY25mkNE8PkaQhxfLIF7DZXx80HD/A3l2jLclYs061xNpWCfoB6WHJTjbH0mV35Q/lRXlC+W8cndbl9t2SfhU+Fb4UfhO+F74GWThknBZ+Em4InwjXIyd1ePnY/Psg3pb1TJNu15TMKWMtFt6ScpKL0ivSMXIn9QtDUlj0h7U7N48t3i8eC0GnMC91dX2sTivgloDTgUVeEGHLTizbf5Da9JLhkhh29QOs1luMcScmBXTIIt7xRFxSBxnuJWfuAd1I7jntkyd/pgKaIwVr3MgmDo2q8x6IdB5QH162mcX7ajtnHGN2bov71OU1+U0fqqoXLD0wX5ZM005UHmySz3qLtDqILDvIL+iH6jB9y2x83ok898GOPQX3lk3Itl0A+BrD6D7tUjWh3fis58BXDigN9yF8M5PJH4B8Gr79/F/XRm8m241mw/wvur4BGDj42bzn+Vmc+NL9L8GcMn8F1kAcXgSteGGAAAAVUlEQVQ4EWNgGAWMKEHQ8P8/Ch8Xp4ERrg/OgKslZAiSZpAeTANAorgMQdMMUsoEIigB2F0AMhHdFVhsBynD7QIcGkCakAFuA5BV4WEPvAF4HDdUpAD/8AyRNqNAxAAAAABJRU5ErkJggg=='],
        ['up-down', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGFJREFUOE+lkkEKQCEIRD2ZJ3Ph3iN4WD9GflpYhj0YYowpGgJmbikd3gjMDFokwbuT1iAiurG5nomgqo5QaPo9ERQRI6Jf7sfGjudy2je23+i0Wl2oQ85TOdlfrJQOazF8br+rqTXQKn0AAAAASUVORK5CYII='],
        ['up-down-spin', 'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAYAAADUFP50AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwQAADsEBuJFr7QAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC41ZYUyZQAAAGJJREFUOE+lkwEKACEIBH2Zb/PnHsoGeaVJDUjGOgRRpKpkiIj+y4MME3eDR7kaKOVNsJyMNjIHzGy9YnW6J7qIcrriQimeCqORNABd0fpRTkt8uVUj7EsxC6vs/q3e/Q6iD2bwnByjPXHNAAAAAElFTkSuQmCC'],
        ['up-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA9SURBVBhXbYvRCgAgCAOtqP//Y9tElw8NDrcDzd0DBCd7iSL3E0IvGOpf2fKXeZUFKDcYFMwBlDNWS76bXUM5P9In5AzyAAAAAElFTkSuQmCC'],
        ['down-arrow', 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAKCAYAAAB8OZQwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuNWWFMmUAAAA+SURBVBhXhYvRCgAgCAOtqP//4+WWhtBDB1duqBUQ/2W5LLtSMFyW020skuecwOGj6QzfkuExt1LlcqICgG3S7z/SL/jVpgAAAABJRU5ErkJggg==']
    ];


    (function() {
        var each, img;
        for (var i = 0; i < imgData.length; i++) {
            each = imgData[i];
            img = new Image();
            img.src = 'data:image/png;base64,' + each[1];
            imageCache[each[0]] = img;
        }
    })();

    Polymer('fin-hypergrid-behavior-base', { /* jslint ignore:line */

        /**
         * @property {object} tableState - memento for the user configured visual properties of the table
         * @instance
         */
        tableState: null,

        /**
         * @property {fin-hypergrid} grid - my instance of hypergrid
         * @instance
         */
        grid: null,

        /**
         * @property {array} editorTypes - list of default cell editor names
         * @instance
         */
        editorTypes: ['choice', 'textfield', 'color', 'slider', 'spinner', 'date'],

        /**
         * @property {object} featureChain - controller chain of command
         * @instance
         */
        featureChain: null,

        dataModel: null,
        baseModel: null,
        cellProviderDecorator: null,

        scrollPositionX: 0,
        scrollPositionY: 0,

        getDataModel: function() {
            if (this.dataModel === null) {
                var dataModel = this.getBaseModel();
                var cellProviderDecorator = this.getCellProviderDecorator();
                var reorderModel = this.getDefaultReorderDataModel();
                reorderModel.setComponent(cellProviderDecorator);
                cellProviderDecorator.setComponent(dataModel);
                this.setDataModel(reorderModel);
            }
            return this.dataModel;
        },

        getBaseModel: function() {
            if (this.baseModel === null) {
                this.baseModel = this.getDefaultDataModel();
            }
            return this.baseModel;
        },

        getCellProviderDecorator: function() {
            if (this.cellProviderDecorator === null) {
                this.cellProviderDecorator = this.getDefaultCellProviderDecorator();
            }
            return this.cellProviderDecorator;
        },

        getCellRenderer: function(config, x, y) {
            return this.getDataModel().getCellRenderer(config, x, y);
        },

        getDefaultCellProviderDecorator: function() {
            var model = document.createElement('fin-hypergrid-data-model-decorator-cell-provider');
            return model;
        },

        getDefaultDataModel: function() {
            var model = document.createElement('fin-hypergrid-data-model-base');
            return model;
        },

        getDefaultReorderDataModel: function() {
            var model = document.createElement('fin-hypergrid-data-model-decorator-reorder');
            return model;
        },

        setDataModel: function(newDataModel) {
            this.dataModel = newDataModel;
        },

        /**
         * @function
         * @instance
         * @description
         utility function to empty an object of its members
         * @param {Object} obj - the object to empty
         */
        clearObjectProperties: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    delete obj[prop];
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         polymer lifecycle event
         */
        ready: function() {
            this.readyInit();
        },

        /**
         * @function
         * @instance
         * @description
         the function to override for initialization
         */
        readyInit: function() {
            this.getDataModel();
            this.cellProvider = this.createCellProvider();
            this.renderedColumnCount = 30;
            this.renderedRowCount = 60;
            this.dataUpdates = {}; //for overriding with edit values;
            //this.initColumnIndexes();
        },

        /**
         * @function
         * @instance
         * @description
         getter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
         * #### returns: Object
         */
        getState: function() {
            if (!this.tableState) {
                this.tableState = this.getDefaultState();
                this.initColumnIndexes(this.tableState);
            }
            return this.tableState;
        },

        /**
         * @function
         * @instance
         * @description
         clear all table state
         */
        clearState: function() {
            this.tableState = null;
        },

        /**
         * @function
         * @instance
         * @description
         create a default empty tablestate
         * #### returns: Object
         */
        getDefaultState: function() {
            var tableProperties = this.getGrid()._getProperties();
            var state = Object.create(tableProperties);

            merge(state, {
                columnIndexes: [],

                rowHeights: {},
                columnProperties: [],

                cellProperties: {}
            });

            return state;
        },


        /**
        * @function
        * @instance
        * @description
        return this table to a previous state. see the [memento pattern](http://c2.com/cgi/wiki?MementoPattern)
        * @param {Object} memento - an encapulated representation of table state
        */
        setState: function(memento) {
            var colProperties = memento.columnProperties;
            delete memento.columnProperties;
            var tableState = this.getState();
            merge(tableState, memento);
            memento.columnProperties = colProperties;
            this.getDataModel().setState(memento);
            var self = this;
            requestAnimationFrame(function() {
                self.applySorts();
                self.changed();
                self.stateChanged();
            });
        },

        applySorts: function() {
            //if I have sorts, apply them now//
        },

        /**
         * @function
         * @instance
         * @description
         fetch the value for a property key
         * #### returns: Object
         * @param {string} key - a property name
         */
        resolveProperty: function(key) {
            return this.grid.resolveProperty(key);
        },

        /**
         * @function
         * @instance
         * @description
         a specific cell was clicked, you've been notified
         * @param {rectangle.point} cell - point of cell coordinates
         * @param {Object} event - all event information
         */
        cellClicked: function(cell, event) {
            this.getBaseModel().cellClicked(cell, event);
        },

        /**
         * @function
         * @instance
         * @description
         a specific cell was le doubclicked, you've been notified
         * @param {rectangle.point} cell - point of cell coordinates
         * @param {Object} event - all event information
         */
        cellDoubleClicked: function( /* cell, event */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         add nextFeature to me If I don't have a next node, otherwise pass it along
         * @param {fin-hypergrid-feature-base} nextFeature - [fin-hypergrid-feature-base](module-features_base.html)
         */
        setNextFeature: function(nextFeature) {
            if (this.featureChain) {
                this.featureChain.setNext(nextFeature);
            } else {
                this.featureChain = nextFeature;
            }
        },

        /**
         * @function
         * @instance
         * @description
         this is the callback for the plugin pattern of nested tags
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        installOn: function(grid) {
            grid.setBehavior(this);
            this.initializeFeatureChain(grid);
        },

        /**
         * @function
         * @instance
         * @description
         create the feature chain - this is the [chain of responsibility](http://c2.com/cgi/wiki?ChainOfResponsibilityPattern) pattern.
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        initializeFeatureChain: function(grid) {
            this.setNextFeature(document.createElement('fin-hypergrid-feature-key-paging'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-click'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-overlay'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-resizing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-row-resizing'));
            //this.setNextFeature(document.createElement('fin-hypergrid-feature-column-moving'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-sorting'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-filters'));
            //this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-selection'));
            //this.setNextFeature(document.createElement('fin-hypergrid-feature-row-selection'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-selection'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-thumbwheel-scrolling'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-editing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-on-hover'));
            //this.setNextFeature(document.createElement('fin-hypergrid-feature-column-autosizing'));

            this.featureChain.initializeOn(grid);
        },

        /**
         * @function
         * @instance
         * @description
         getter for the cell provider
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        getCellProvider: function() {
            return this.cellProvider;
        },

        /**
         * @function
         * @instance
         * @description
         setter for the hypergrid
         * @param {fin-hypergrid} finGrid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        setGrid: function(finGrid) {
            this.grid = finGrid;
            this.getDataModel().setGrid(finGrid);
        },

        /**
         * @function
         * @instance
         * @description
         getter for the hypergrid
         * #### returns: [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {type} varname - descripton
         */
        getGrid: function() {
            return this.grid;
        },

        /**
         * @function
         * @instance
         * @description
         you can override this function and substitute your own cell provider
         * #### returns: [fin-hypergrid-cell-provider](module-._cell-provider.html)
         */
        createCellProvider: function() {
            var provider = document.createElement('fin-hypergrid-cell-provider');
            return provider;
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the top left section of the hypergrid, first check to see if something was overridden
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getValue: function(x, y) {
            return this.getDataModel().getValue(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         update the data at point x, y with value
         * #### returns: type
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         * @param {Object} value - the value to use
         */
        setValue: function(x, y, value) {
            this.getDataModel().setValue(x, y, value);
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the top left section of the hypergrid, first check to see if something was overridden
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getCellProperties: function(x, y) {
            return this.getDataModel().getCellProperties(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         update the data at point x, y with value
         * #### returns: type
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         * @param {Object} value - the value to use
         */
        setCellProperties: function(x, y, value) {
            this.getDataModel().setCellProperties(x, y, value);
        },
        /**
         * @function
         * @instance
         * @description
         return the number of rows
         * #### returns: integer
         */
        getRowCount: function() {
            return this.getDataModel().getRowCount();
        },

        /**
         * @function
         * @instance
         * @description
         return the height in pixels of the fixed rows area
         * #### returns: integer
         */
        getFixedRowsHeight: function() {
            var count = this.getFixedRowCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getRowHeight(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         get height in pixels of a specific row
         * #### returns: integer
         * @param {integer} rowNum - row index of interest
         */
        getRowHeight: function(rowNum) {
            var tableState = this.getState();
            if (tableState.rowHeights) {
                var override = tableState.rowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.getDefaultRowHeight();
        },

        /**
         * @function
         * @instance
         * @description
         returns a lazily initialized value from the properties mechanism for 'defaultRowHeight', should be ~20px
         * #### returns: integer
         */
        getDefaultRowHeight: function() {
            if (!this.defaultRowHeight) {
                this.defaultRowHeight = this.resolveProperty('defaultRowHeight');
            }
            return this.defaultRowHeight;
        },

        /**
         * @function
         * @instance
         * @description
         set the pixel height of a specific row
         * @param {integer} rowNum - the row index of interest
         * @param {integer} height - pixel height
         */
        setRowHeight: function(rowNum, height) {
            var tableState = this.getState();
            tableState.rowHeights[rowNum] = Math.max(5, height);
            this.stateChanged();
        },

        /**
         * @function
         * @instance
         * @description
         return the potential maximum height of the fixed rows areas, this will allow 'floating' fixed rows
         * #### returns: integer
         */
        getFixedRowsMaxHeight: function() {
            var height = this.getFixedRowsHeight();
            return height;
        },

        /**
         * @function
         * @instance
         * @description
         return the width of the fixed column area
         * #### returns: integer
         */
        getFixedColumnsWidth: function() {
            var count = this.getFixedColumnCount();
            var total = 0;
            for (var i = 0; i < count; i++) {
                total = total + this.getColumnWidth(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         return the potential total width of the fixed columns area; this exists to support 'floating' columns
         * #### returns: integer
         */
        getFixedColumnsMaxWidth: function() {
            var width = this.getFixedColumnsWidth();
            return width;
        },

        /**
         * @function
         * @instance
         * @description
         set the scroll position in vertical dimension and notifiy listeners
         * @param {integer} y - the new y value
         */
        _setScrollPositionY: function(y) {
            this.setScrollPositionY(y);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         set the scroll position in horizontal dimension and notifiy listeners
         * @param {integer} x - the new x value
         */
        _setScrollPositionX: function(x) {
            this.setScrollPositionX(x);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         set the number of columns just rendered, includes partially rendered columns
         * @param {integer} count - how many columns were just rendered
         */
        setRenderedColumnCount: function(count) {
            this.renderedColumnCount = count;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows just rendered, includes partially rendered rows
         * @param {integer} count - how many rows were just rendered
         */
        setRenderedRowCount: function(count) {
            this.renderedRowCount = count;
        },


        /**
         * @function
         * @instance
         * @description
         the fixed row area has been clicked, massage the details and call the real function
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        _fixedRowClicked: function(grid, mouse) {
            var x = this.translateColumnIndex(this.getScrollPositionX() + mouse.gridCell.x - this.getFixedColumnCount());
            var translatedPoint = this.grid.rectangles.point.create(x, mouse.gridCell.y);
            mouse.gridCell = translatedPoint;
            this.fixedRowClicked(grid, mouse);
        },

        /**
         * @function
         * @instance
         * @description
         the fixed column area has been clicked, massage the details and call the real function
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
        */
        _fixedColumnClicked: function(grid, mouse) {
            var translatedPoint = this.grid.rectangles.point.create(mouse.gridCell.x, this.getScrollPositionY() + mouse.gridCell.y - this.getFixedRowCount());
            mouse.gridCell = translatedPoint;
            this.fixedColumnClicked(grid, mouse);
        },

        moveSingleSelect: function(grid, x, y) {
            if (this.featureChain) {
                this.featureChain.moveSingleSelect(grid, x, y);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate setting the cursor up the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         */
        setCursor: function(grid) {
            grid.updateCursor();
            this.featureChain.setCursor(grid);
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse move to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseMove: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseMove(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling tap to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onTap: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleTap(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling tap to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onContextMenu: function(grid, event) {
            var proceed = grid.fireSyntheticContextMenuEvent(event);
            if (proceed && this.featureChain) {
                this.featureChain.handleContextMenu(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling wheel moved to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onWheelMoved: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleWheelMoved(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse up to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse drag to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onMouseDrag: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDrag(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling key down to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onKeyDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling key up to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onKeyUp: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleKeyUp(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling double click to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onDoubleClick: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleDoubleClick(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling hold pulse to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        onHoldPulse: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleHoldPulse(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling double click to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        toggleColumnPicker: function() {
            if (this.featureChain) {
                this.featureChain.toggleColumnPicker(this.getGrid());
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse down to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        handleMouseDown: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseDown(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         delegate handling mouse exit to the feature chain of responsibility
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} event - the event details
         */
        handleMouseExit: function(grid, event) {
            if (this.featureChain) {
                this.featureChain.handleMouseExit(grid, event);
                this.setCursor(grid);
            }
        },

        /**
         * @function
         * @instance
         * @description
         this function is replaced by the grid on initialization and serves as the callback
         */
        changed: function() {},

        /**
         * @function
         * @instance
         * @description
         this function is replaced by the grid on initialization and serves as the callback
         */
        shapeChanged: function() {},

        /**
         * @function
         * @instance
         * @description
         return true if we can re-order columns
         * #### returns: boolean
         */
        isColumnReorderable: function() {
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         return the properties for a specific column, these are used if no cell properties are specified
         * #### returns: Object
         * @param {index} columnIndex - the column index of interest
         */
        getColumnProperties: function(columnIndex) {
            var properties = this.getDataModel().getColumnProperties(columnIndex);
            return properties;
        },

        setColumnProperties: function(columnIndex, properties) {
            this.getDataModel().setColumnProperties(columnIndex, properties);
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         returns the list of labels to use for the column picker
         * #### returns: Array of strings
         */
        getColumnDescriptors: function() {
            //assumes there is one row....
            this.insureColumnIndexesAreInitialized();
            var tableState = this.getState();
            var columnCount = tableState.columnIndexes.length;
            var labels = [];
            for (var i = 0; i < columnCount; i++) {
                var id = tableState.columnIndexes[i];
                labels.push({
                    id: id,
                    label: this.getHeader(id),
                    field: this.getField(id)
                });
            }
            return labels;
        },

        /**
         * @function
         * @instance
         * @description
         return the field at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getField: function(colIndex) {
            return this.getFields()[colIndex];
        },
        /**
         * @function
         * @instance
         * @description
         return the column heading at colIndex
         * #### returns: string
         * @param {integer} colIndex - the column index of interest
         */
        getHeader: function(colIndex) {
            return this.getHeaders()[colIndex];
        },
        /**
         * @function
         * @instance
         * @description
         this is called by the column editor post closing; rebuild the column order indexes
         * @param {Array} list - list of column objects from the column editor
         */
        setColumnDescriptors: function(list) {
            //assumes there is one row....
            var tableState = this.getState();

            var columnCount = list.length;
            var indexes = [];
            var i;
            for (i = 0; i < columnCount; i++) {
                indexes.push(list[i].id);
            }
            tableState.columnIndexes = indexes;
            this.changed();
        },

        /**
         * @function
         * @instance
         * @description
         return an Array of strings of the column header labels that are currently hidden
         * #### returns: Array of strings
         */
        getHiddenColumnDescriptors: function() {
            var tableState = this.getState();
            var indexes = tableState.columnIndexes;
            var labels = [];
            var columnCount = this.getDataModel().getColumnCount();
            for (var i = 0; i < columnCount; i++) {
                if (indexes.indexOf(i) === -1) {
                    labels.push({
                        id: i,
                        label: this.getHeader(i),
                        field: this.getField(i)
                    });
                }
            }
            return labels;
        },

        /**
         * @function
         * @instance
         * @description
         hide columns that are specified by their indexes
         * @param {Array} arrayOfIndexes - an array of column indexes to hide
         */
        hideColumns: function(arrayOfIndexes) {
            var tableState = this.getState();
            var order = tableState.columnIndexes;
            for (var i = 0; i < arrayOfIndexes.length; i++) {
                var each = arrayOfIndexes[i];
                if (order.indexOf(each) !== -1) {
                    order.splice(order.indexOf(each), 1);
                }
            }
        },

        /**
         * @function
         * @instance
         * @description
         return the number of fixed columns
         * #### returns: integer
         */
        getFixedColumnCount: function() {
            var tableState = this.getState();
            return tableState.fixedColumnCount || 0;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of fixed columns
         * @param {integer} numberOfFixedColumns - the integer count of how many columns to be fixed
         */
        setFixedColumnCount: function(numberOfFixedColumns) {
            var tableState = this.getState();
            tableState.fixedColumnCount = numberOfFixedColumns;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getFixedRowCount: function() {
            if (!this.tableState) {
                return 0;
            }
            var usersSize = this.tableState.fixedRowCount || 0;
            var headers = this.getGrid().getHeaderRowCount();
            var total = usersSize + headers;
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows that are fixed
         * @param {integer} numberOfFixedRows - the count of rows to be set fixed
         */
        setFixedRowCount: function(numberOfFixedRows) {
            this.tableState.fixedRowCount = numberOfFixedRows;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getHeaderRowCount: function() {
            var grid = this.getGrid();
            var header = grid.isShowHeaderRow() ? 1 : 0;
            var filter = grid.isShowFilterRow() ? 1 : 0;
            var totals = this.getTopTotals().length;
            var count = header + filter + totals;
            return count;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows that are fixed
         * @param {integer} numberOfFixedRows - the count of rows to be set fixed
         */
        setHeaderRowCount: function(numberOfHeaderRows) {
            this.tableState.headerRowCount = numberOfHeaderRows;
        },

        /**
         * @function
         * @instance
         * @description
         return the count of fixed rows
         * #### returns: integer
         */
        getHeaderColumnCount: function() {
            var grid = this.getGrid();
            var count = grid.resolveProperty('headerColumnCount');
            return count;
        },

        /**
         * @function
         * @instance
         * @description
         set the number of rows that are fixed
         * @param {integer} numberOfFixedRows - the count of rows to be set fixed
         */
        setHeaderColumnCount: function(numberOfHeaderColumns) {
            this.tableState.headerColumnCount = numberOfHeaderColumns;
        },
        /**
         * @function
         * @instance
         * @description
         build and open the editor within the container div argument, this function should return false if we don't want the editor to open
         * #### returns: boolean
         * @param {HTMLDivElement} div - the containing div element
         */
        openEditor: function(div) {
            var container = document.createElement('div');

            var hidden = document.createElement('fin-hypergrid-dnd-list');
            var visible = document.createElement('fin-hypergrid-dnd-list');

            container.appendChild(hidden);
            container.appendChild(visible);

            this.beColumnStyle(hidden.style);
            hidden.title = 'hidden columns';
            hidden.list = this.getHiddenColumnDescriptors();

            this.beColumnStyle(visible.style);
            visible.style.left = '50%';
            visible.title = 'visible columns';
            visible.list = this.getColumnDescriptors();

            div.lists = {
                hidden: hidden.list,
                visible: visible.list
            };
            div.appendChild(container);
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         the editor is requesting close return true or false, and deal with the edits
         * @param {HTMLDivElement} div - the containing div element
         */
        closeEditor: function(div) {
            noop(div);
            var lists = div.lists;
            this.setColumnDescriptors(lists.visible);
            return true;
        },

        /**
         * @function
         * @instance
         * @description
         a dnd column has just been dropped, we've been notified
         */
        endDragColumnNotification: function() {},

        /**
         * @function
         * @instance
         * @description
         bind column editor appropriate css values to arg style
         * @param {HTMLStyleElement} style - the style object to enhance
         */
        beColumnStyle: function(style) {
            style.top = '5%';
            style.position = 'absolute';
            style.width = '50%';
            style.height = '99%';
            style.whiteSpace = 'nowrap';
        },

        /**
         * @function
         * @instance
         * @description
         return the cursor at a specific x,y coordinate
         * #### returns: string
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        getCursorAt: function( /* x, y */ ) {
            return null;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns
         * #### returns: integer
         */
        getColumnCount: function() {
            // if (!this.tableState) {
            //     return this.getDataModel().getColumnCount();
            // }
            // return this.tableState.columnIndexes.length;

            return this.getDataModel().getColumnCount();
        },

        /**
         * @function
         * @instance
         * @description
         return the column width at index x
         * #### returns: integer
         * @param {integer} x - the column index of interest
         */
        getColumnWidth: function(x) {
            var override = this.getDataModel().getColumnWidth(x);
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultColumnWidth');
        },

        /**
         * @function
         * @instance
         * @description
         set the column width at column x
         * @param {integer} x - the column index of interest
         * @param {integer} width - the width in pixels
         */
        setColumnWidth: function(x, width) {
            this.getDataModel().setColumnWidth(x, width);
            this.stateChanged();
        },

        /**
         * @function
         * @instance
         * @description
         return the column alignment at column x
         * #### returns: string ['left','center','right']
         * @param {integer} x - the column index of interest
         */
        getColumnAlignment: function( /* x */ ) {
            return 'center';
        },

        /**
         * @function
         * @instance
         * @description
         quietly set the scroll position in the horizontal dimension
         * @param {integer} x - the position in pixels
         */
        setScrollPositionX: function(x) {
            this.scrollPositionX = x;
        },

        getScrollPositionX: function() {
            return this.scrollPositionX;
        },

        /**
         * @function
         * @instance
         * @description
         quietly set the scroll position in the horizontal dimension
         * #### returns: type
         * @param {integer} y - the position in pixels
         */
        setScrollPositionY: function(y) {
            this.scrollPositionY = y;
        },

        getScrollPositionY: function() {
            return this.scrollPositionY;
        },

        /**
         * @function
         * @instance
         * @description
         return the cell editor for coordinate x,y
         * #### returns: [fin-hypergrid-cell-editor-base](module-cell-editors_base.html)
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getCellEditorAt: function(x, y) {
            return this.getDataModel().getCellEditorAt(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         fixed row has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        columnHeaderClicked: function(grid, mouse) {
            if (mouse.gridCell.y < 1) {
                this.toggleSort(mouse.gridCell.x);
            } else {
                this.getGrid().toggleSelectColumn(mouse.gridCell.x);
            }
        },

        /**
         * @function
         * @instance
         * @description
         fixed row has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        topLeftClicked: function(grid, mouse) {
            if (mouse.gridCell.y < 1) {
                this.toggleSort(mouse.gridCell.x);
            }
        },

        /**
         * @function
         * @instance
         * @description
         fixed row has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        toggleSort: function(x) {
            this.getDataModel().toggleSort(x);
        },

        /**
         * @function
         * @instance
         * @description
         fixed column has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        rowHeaderClicked: function(grid, mouse) {
            this.getGrid().toggleSelectRow(mouse.gridCell.y);
        },

        /**
         * @function
         * @instance
         * @description
         returns true if we should highlight on hover
         * #### returns: boolean
         * @param {boolean} isColumnHovered - the column is hovered or not
         * @param {boolean} isRowHovered - the row is hovered or not
         */
        highlightCellOnHover: function(isColumnHovered, isRowHovered) {
            return isColumnHovered && isRowHovered;
        },

        /**
         * @function
         * @instance
         * @description
         return the columnId/label/fixedRowValue at x
         * #### returns: string
         * @param {integer} x - the view translated x index
         */
        getColumnId: function(x) {
            var col = this.getFixedRowValue(x, 0);
            return col;
        },

        /**
         * @function
         * @instance
         * @description
         return an HTMLImageElement given it's alias
         * #### returns: HTMLImageElement
         * @param {string} key - an image alias
         */
        getImage: function(key) {
            var image = imageCache[key];
            return image;
        },


        /**
         * @function
         * @instance
         * @description
         set the image for a specific alias
         * @param {string} key - an image alias
         * @param {HTMLImageElement} image - the image to cache
         */
        setImage: function(key, image) {
            imageCache[key] = image;
        },

        /**
         * @function
         * @instance
         * @description
         check to see that columns are at their minimum width to display all data
         * @param {Array} fixedMinWidths - the minimum sizes to fit all data for each column in the fixed area
         * @param {Array} minWidths - the minimum sizes to fit all data for each column in the data area
         */
        checkColumnAutosizing: function(minWidths) {
            this.getDataModel().checkColumnAutosizing(minWidths);
        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a fixed row cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellFixedRowPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a fixed column cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
        */
        cellFixedColumnPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function is a hook and is called just before the painting of a top left cell occurs
         * @param {rectangle.point} cell - [rectangle.point](http://stevewirts.github.io/fin-rectangle/components/fin-rectangle/)
         */
        cellTopLeftPrePaintNotification: function( /* cell */ ) {

        },

        /**
         * @function
         * @instance
         * @description
         this function enhance the double click event just before it's broadcast to listeners
         * @param {Object} event - event to enhance
         */
        enhanceDoubleClickEvent: function( /* event */ ) {},

        /**
         * @function
         * @instance
         * @description
         reset both fixed and normal column indexes, this is will cause columns to display in their true order
         */
        initColumnIndexes: function(tableState) {
            var columnCount = this.getDataModel().getColumnCount();
            var i;
            tableState.columnIndexes = [];
            for (i = 0; i < columnCount; i++) {
                tableState.columnIndexes[i] = i;
            }
        },

        /**
         * @function
         * @instance
         * @description
         make sure the column indexes are initialized
         */
        insureColumnIndexesAreInitialized: function() {
            this.swapColumns(0, 0);
        },

        /**
         * @function
         * @instance
         * @description
         swap src and tar columns
         * @param {integer} src - column index
         * @param {integer} tar - column index
         */
        swapColumns: function(source, target) {
            var tableState = this.getState();
            var indexes = tableState.columnIndexes;
            if (indexes.length === 0) {
                this.initColumnIndexes(tableState);
                indexes = tableState.columnIndexes;
            }
            var tmp = indexes[source];
            indexes[source] = indexes[target];
            indexes[target] = tmp;
            this.stateChanged();
        },

        getColumnEdge: function(c, renderer) {
            return this.getDataModel().getColumnEdge(c, renderer);
        },

        resetColumnIndexes: function() {
            this.initColumnIndexes(this.tableState);
            this.shapeChanged();
        },

        setTotalsValue: function(x, y, value) {
            this.getGrid().setTotalsValueNotification(x, y, value);
        },

        /**
        * @function
        * @instance
        * @description
        return the object at y index
        * #### returns: Object
        * @param {integer} y - the row index of interest
        */
        getRow: function(y) {
            return this.getDataModel().getRow(y);
        },

        convertViewPointToDataPoint: function(viewPoint) {
            return this.getDataModel().convertViewPointToDataPoint(viewPoint);
        },
        convertDataPointToViewPoint: function(dataPoint) {
            return this.getDataModel().convertDataPointToViewPoint(dataPoint);
        },
        setGroups: function(arrayOfColumnIndexes) {
            this.getBaseModel().setGroups(arrayOfColumnIndexes);
        },
        setAggregates: function(mapOfKeysToFunctions) {
            this.getBaseModel().setAggregates(mapOfKeysToFunctions);
        },
        hasHierarchyColumn: function() {
            return false;
        }
    });
})();
