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

        getDataModel: function() {
            if (this.dataModel === null) {
                this.setDataModel(this.getDefaultDataModel());
            }
            return this.dataModel;
        },

        getDefaultDataModel: function() {
            var model = document.createElement('fin-hypergrid-data-model-base');
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
            return {
                columnIndexes: [],
                fixedColumnIndexes: [],
                hiddenColumns: [],

                columnWidths: [],
                fixedColumnWidths: [],
                fixedColumnAutosized: [],

                rowHeights: {},
                fixedRowHeights: {},
                columnProperties: [],
                columnAutosized: [],

                fixedColumnCount: 0,
                fixedRowCount: 1,
            };
        },

        /**
         * @function
         * @instance
         * @description
         setter for a [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
         * @param {Object} state - [Memento](http://c2.com/cgi/wiki?MementoPattern) Object
         */
        setState: function(state) {
            var tableState = this.getState();
            for (var key in state) {
                if (state.hasOwnProperty(key)) {
                    tableState[key] = state[key];
                }
            }
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
        cellClicked: function( /* cell, event */ ) {

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
         reset both fixed and normal column indexes, this is will cause columns to display in their true order
         */
        initColumnIndexes: function(tableState) {
            var columnCount = this.getColumnCount();
            var fixedColumnCount = tableState.fixedColumnCount;
            var i;
            for (i = 0; i < columnCount; i++) {
                tableState.columnIndexes[i] = i;
            }
            for (i = 0; i < fixedColumnCount; i++) {
                tableState.fixedColumnIndexes[i] = i;
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
        swapColumns: function(src, tar) {
            var tableState = this.getState();
            var fixedColumnCount = this.getState().fixedColumnCount;
            var indexes = tableState.columnIndexes;
            if (indexes.length === 0) {
                this.initColumnIndexes(tableState);
                indexes = tableState.columnIndexes;
            }
            var tmp = indexes[src + fixedColumnCount];
            indexes[src + fixedColumnCount] = indexes[tar + fixedColumnCount];
            indexes[tar + fixedColumnCount] = tmp;
        },

        /**
         * @function
         * @instance
         * @description
         translate the viewed index to the real index
         * #### returns: integer
         * @param {integer} x - viewed index
         */
        translateColumnIndex: function(x) {
            var tableState = this.getState();
            var fixedColumnCount = tableState.fixedColumnCount;
            var indexes = tableState.columnIndexes;
            if (indexes.length === 0) {
                return x;
            }
            return indexes[x + fixedColumnCount];
        },

        /**
         * @function
         * @instance
         * @description
         translate the real index to the viewed index
         * #### returns: integer
         * @param {integer} x - the real index
         */
        unTranslateColumnIndex: function(x) {
            var tableState = this.getState();
            return tableState.columnIndexes.indexOf(x);
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
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-selection'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-moving'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-thumbwheel-scrolling'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-cell-editing'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-sorting'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-on-hover'));
            this.setNextFeature(document.createElement('fin-hypergrid-feature-column-autosizing'));

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
         return the value at x,y for the top left section of the hypergrid
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getTopLeftValue: function( /* x, y */ ) {
            return '';
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
        _getValue: function(x, y) {
            x = this.translateColumnIndex(x);
            var override = this.dataUpdates['p_' + x + '_' + y];
            if (override) {
                return override;
            }
            return this.getValue(x, y);
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
        _setValue: function(x, y, value) {
            x = this.translateColumnIndex(x);
            this.setValue(x, y, value);
        },

        /**
         * @function
         * @instance
         * @description
         return the view translated value at x,y for the fixed row area
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        _getFixedRowValue: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowValue(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         return the value at x,y for the fixed row area
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedColumnValue: function(x, y) {
            //x = this.fixedtranslateColumnIndex(x);
            return y + 1;
        },

        /**
         * @function
         * @instance
         * @description
         return the number of rows
         * #### returns: integer
         */
        getRowCount: function() {
            //jeepers batman a quadrillion rows!
            return 1000000000000000;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns adjusted for hidden columns
         * #### returns: integer
         */
        _getColumnCount: function() {
            var tableState = this.getState();
            var fixedColumnCount = this.getState().fixedColumnCount;
            return this.getColumnCount() - tableState.hiddenColumns.length - fixedColumnCount;
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
                total = total + this.getFixedRowHeight(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         return the pixel height of a specific row in the fixed row area
         * #### returns: integer
         * @param {integer} rowNum - the row index of interest
         */
        getFixedRowHeight: function(rowNum) {
            var tableState = this.getState();
            if (tableState.fixedRowHeights) {
                var override = tableState.fixedRowHeights[rowNum];
                if (override) {
                    return override;
                }
            }
            return this.resolveProperty('defaultFixedRowHeight');
        },

        /**
         * @function
         * @instance
         * @description
         set the height of a specific row in the fixed row area
         * @param {integer} rowNum - the row integer to affect
         * @param {integer} height - the pixel height to set it to
         */
        setFixedRowHeight: function(rowNum, height) {
            //console.log(rowNum + ' ' + height);
            var tableState = this.getState();
            tableState.fixedRowHeights[rowNum] = Math.max(5, height);
            this.changed();
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
            this.changed();
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
                total = total + this.getFixedColumnWidth(i);
            }
            return total;
        },

        /**
         * @function
         * @instance
         * @description
         set the width of a specific column in the fixed column area
         * @param {integer} colNumber - the column index of interest
         * @param {integer} width - the width in pixels
         */
        setFixedColumnWidth: function(colNumber, width) {
            var tableState = this.getState();
            tableState.fixedColumnWidths[colNumber] = Math.max(5, width);
            this.changed();
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
         return the width of a specific column in the fixed column area
         * #### returns: integer
         * @param {integer} colNumber - the column index of interest
         */
        getFixedColumnWidth: function(colNumber) {
            var tableState = this.getState();
            var override = tableState.fixedColumnWidths[colNumber];
            if (override) {
                return override;
            }
            return this.resolveProperty('defaultFixedColumnWidth');
        },

        /**
         * @function
         * @instance
         * @description
         return the behavior column width of specific column given a view column index
         * #### returns: integer
         * @param {integer} x - the view column index
         */
        _getColumnWidth: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnWidth(x);
        },

        /**
         * @function
         * @instance
         * @description
         set the width of a specific column in the model given a view column index
         * @param {integer} x - the view column index
         * @param {integer} width - the width in pixels
         */
        _setColumnWidth: function(x, width) {
            x = this.translateColumnIndex(x);
            this.setColumnWidth(x, width);
            this.changed();
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
         return the view translated alignment for column x
         * #### returns: string ['left','center','right']
         * @param {integer} x - the column index of interest
         */
        _getColumnAlignment: function(x) {
            x = this.translateColumnIndex(x);
            return this.getColumnAlignment(x);
        },

        /**
         * @function
         * @instance
         * @description
         return the alignment at x,y of the top left area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the x coordinate
         * @param {integer} x - the y coordinate
         */
        getTopLeftAlignment: function( /* x, y */ ) {
            return 'center';
        },

        /**
         * @function
         * @instance
         * @description
         return the alignment at x for the fixed column area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the fixed column index of interest
         */
        getFixedColumnAlignment: function( /* x */ ) {
            return this.resolveProperty('fixedColumnAlign');
        },

        /**
         * @function
         * @instance
         * @description
         return the view translated alignment at x,y in the fixed row area
         * #### returns: string ['left','center','right']
         * @param {integer} x - the fixed column index of interest
         * @param {integer} y - the fixed row index of interest
         */
        _getFixedRowAlignment: function(x, y) {
            x = this.translateColumnIndex(x);
            return this.getFixedRowAlignment(x, y);
        },

        /**
         * @function
         * @instance
         * @description
         the top left area has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        topLeftClicked: function(grid, mouse) {
            if (mouse.gridCell.x < this.getState().fixedColumnCount) {
                this.fixedRowClicked(grid, mouse);
            } else {
                console.log('top Left clicked: ' + mouse.gridCell.x, mouse);
            }
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
         return the cell editor for cell at x,y
         * #### returns: [fin-hypergrid-cell-editor-base](module-cell-editors_base.html)
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        _getCellEditorAt: function(x, y) {
            noop(y);
            x = this.translateColumnIndex(x);
            return this.getCellEditorAt(x);
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
            //if no cell properties are supplied these properties are used
            //this probably should be moved into it's own object
            // this.clearObjectProperties(this.columnProperties);
            // if (columnIndex === 4) {
            //     this.columnProperties.bgColor = 'maroon';
            //     this.columnProperties.fgColor = 'white';
            // }
            var tableState = this.getState();
            var properties = tableState.columnProperties[columnIndex];
            if (!properties) {
                properties = {};
                tableState.columnProperties[columnIndex] = properties;
            }
            return properties;
        },

        setColumnProperty: function(columnIndex, key, value) {
            var properties = this.getColumnProperties(columnIndex);
            properties[key] = value;
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
            var fixedColumnCount = this.getState().fixedColumnCount;
            var labels = [];
            for (var i = 0; i < columnCount; i++) {
                var id = tableState.columnIndexes[i];
                if (id >= fixedColumnCount) {
                    labels.push({
                        id: id,
                        label: this.getHeader(id),
                        field: this.getField(id)
                    });
                }
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
            return colIndex;
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
            return this.getFixedRowValue(colIndex, 0);
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
            var fixedColumnCount = this.getState().fixedColumnCount;

            var columnCount = list.length;
            var indexes = [];
            var i;
            for (i = 0; i < fixedColumnCount; i++) {
                indexes.push(i);
            }
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
            var indexes = tableState.hiddenColumns;
            var labels = new Array(indexes.length);
            for (var i = 0; i < labels.length; i++) {
                var id = indexes[i];
                labels[i] = {
                    id: id,
                    label: this.getHeader(id),
                    field: this.getField(id)
                };
            }
            return labels;
        },

        /**
         * @function
         * @instance
         * @description
         set which column are hidden post column editor close
         * @param {Array} list - the list column descriptors
         */
        setHiddenColumnDescriptors: function(list) {
            //assumes there is one row....
            var columnCount = list.length;
            var indexes = new Array(columnCount);
            for (var i = 0; i < columnCount; i++) {
                indexes[i] = list[i].id;
            }
            var tableState = this.getState();
            tableState.hiddenColumns = indexes;
            this.changed();
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
            var indexes = tableState.hiddenColumns;
            var order = tableState.columnIndexes;
            for (var i = 0; i < arrayOfIndexes.length; i++) {
                var each = arrayOfIndexes[i];
                if (indexes.indexOf(each) === -1) {
                    indexes.push(each);
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
            return this.tableState.fixedRowCount || 0;
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
            this.setHiddenColumnDescriptors(lists.hidden);
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
         return the data value at coordinates x,y.  this is the main "model" function that allows for virtualization
         * #### returns: Object
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        getValue: function(x, y) {
            return x + ', ' + y;
        },

        /**
         * @function
         * @instance
         * @description
         set the data value at coordinates x,y
         * @param {integer} x - the x coordinate
         * @param {integer} y - the y coordinate
         */
        setValue: function(x, y, value) {
            this.dataUpdates['p_' + x + '_' + y] = value;
        },

        /**
         * @function
         * @instance
         * @description
         return the total number of columns
         * #### returns: integer
         */
        getColumnCount: function() {
            return 300;
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
            var tableState = this.getState();
            var override = tableState.columnWidths[x];
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
            var tableState = this.getState();
            tableState.columnWidths[x] = Math.max(5, width);
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
            this.getDataModel().setScrollPositionX(x);
        },

        getScrollPositionX: function() {
            return this.getDataModel().getScrollPositionX();
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
            this.getDataModel().setScrollPositionY(y);
        },

        getScrollPositionY: function() {
            return this.getDataModel().getScrollPositionY();
        },

        /**
         * @function
         * @instance
         * @description
         get the view translated alignment at x,y in the fixed row area
         * #### returns: string ['left','center','right']
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedRowAlignment: function(x, y) {
            noop(x, y);
            return this.resolveProperty('fixedRowAlign');
        },

        /**
         * @function
         * @instance
         * @description
         return the data value at point x,y
         * #### returns: Object
         * @param {integer} x - x coordinate
         * @param {integer} y - y coordinate
         */
        getFixedRowValue: function(x /*, y*/ ) {
            return x;
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
            noop(x, y);
            var cellEditor = this.grid.resolveCellEditor('textfield');
            return cellEditor;
        },

        /**
         * @function
         * @instance
         * @description
         fixed row has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        fixedRowClicked: function(grid, mouse) {
            this.toggleSort(mouse.gridCell.x);
        },

        /**
         * @function
         * @instance
         * @description
         toggle the sort at colIndex to it's next state
         * @param {integer} colIndex - the column index of interest
         */
        toggleSort: function(colIndex) {
            console.log('toggleSort(' + colIndex + ')');
        },

        /**
         * @function
         * @instance
         * @description
         fixed column has been clicked, you've been notified
         * @param {fin-hypergrid} grid - [fin-hypergrid](module-._fin-hypergrid.html)
         * @param {Object} mouse - event details
         */
        fixedColumnClicked: function(grid, mouse) {
            console.log('fixedColumnClicked(' + mouse.gridCell.x + ', ' + mouse.gridCell.y + ')');
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
            x = this.translateColumnIndex(x);
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
        checkColumnAutosizing: function(fixedMinWidths, minWidths) {
            var self = this;
            var tableState = this.getState();
            var myFixed = tableState.fixedColumnWidths;
            var myWidths = tableState.columnWidths;
            var repaint = false;
            var a, b, c, d = 0;
            for (c = 0; c < fixedMinWidths.length; c++) {
                a = myFixed[c];
                b = fixedMinWidths[c];
                d = tableState.fixedColumnAutosized[c];
                if (a !== b || !d) {
                    myFixed[c] = !d ? b : Math.max(a, b);
                    tableState.fixedColumnAutosized[c] = true;
                    repaint = true;
                }
            }
            for (c = 0; c < minWidths.length; c++) {
                var ti = this.translateColumnIndex(c);
                a = myWidths[ti];
                b = minWidths[c];
                d = tableState.columnAutosized[c];
                if (a !== b || !d) {
                    myWidths[ti] = !d ? b : Math.max(a, b);
                    tableState.columnAutosized[c] = true;
                    repaint = true;
                }
            }
            if (repaint) {
                setTimeout(function() {
                    self.shapeChanged();
                });
            }
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
         force an autosizing of the column widths
         */
        autosizeColumns: function() {
            var self = this;
            setTimeout(function() {
                var tableState = self.getState();
                tableState.fixedColumnAutosized = [];
                tableState.columnAutosized = [];
            }, 40);
        }
    });
})();
