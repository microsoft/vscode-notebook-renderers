# Changelog

## 1.0.12
* Ship jQuery and requirejs as pre-load scripts so that all outputs have access to these scripts.

## 1.0.10
* Add support for VegaLite 5.
* Fixes to rendering of Vega 5, VegaLite 3 and VegaLite 4.
* Fixes to rendering of JavaScript mime types to ensure the right variables are available and right context is setup.
* Ensure `jQuery` is available when rendering JavaScript mime types.
* Ensure outputs generated using `IPython.display.code` are displayed with the right syntax highlighting.

## 1.0.7
* Update plotly to version 2.11.1
* Update npm packages.

## 1.0.6
* Removed rendering of text/latex in favor of built-in support.

## 1.0.5
* Updated to use Plotly version 2.7.0

## 1.0.4
* Updated to use Plotly version 2.6.4

### Thanks

Thanks to the following projects which we fully rely on to provide some of
our features:

-   [Python Extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python)

Also thanks to the various projects we provide integrations with which help
make this extension useful:

-   [Jupyter](https://jupyter.org/):
    [Notebooks](https://jupyter-notebook.readthedocs.io/en/latest/?badge=latest),
    [ipywidgets](https://ipywidgets.readthedocs.io/en/latest/),
