# react-native-photo-browse

[![npm version](https://img.shields.io/npm/v/react-native-photo-browse.svg?style=flat)](https://www.npmjs.com/package/react-native-photo-browse)

Here is a browser page for multiple local or remote photos.

It supports:

* Multiple photos.
* Local image or remote url.
* Delete item.
* Save item to local.
* Image for placeholder or fail load.
* Orientation supported.

## Install

Install by Yarn:

```shell
yarn add react-native-photo-browse
```

Install by NPM:

```shell
npm install --save react-native-photo-browse
```

## Usage

First import in the file:

```jsx
import * as PhotoBrowser from 'react-native-photo-browse';
```

Then call method in function:

```jsx
func = () => {
  const options = {
    // ...options
  };
  PhotoBrowser.showPhotoBrowserPage(options);
}
```

## Options

| Name | Description |
| :-: | :- |
| images | Image urls array to show |
| failImage | A placeholder image when image is invalid |
| currentIndex | Initial index of image to show. Default is 0 |
| canDelete | Enable or disable delete button. Default is false |
| okLabel | Label of OK button |
| deleteLabel | Label of Delete button |
| loadingText | Loading tips |
| onClose | Callback method when close |
| supportedOrientations | Orientations supported for Modal |
| successDownloadText | DownLoad and Save success tips  |
| cancelDownloadText | cancel DownLoad  tips |
| clickdButtonIcon | clickdButton IconFont |
| unClickdButtonIcon | unClickdButton IconFont |
| closeIcon | stop download IconFont |

## Global Settings

You can change settings globally.

```jsx
import {PhotoBrowserPage} from 'react-native-photo-browse';

PhotoBrowserPage.defaultProps.xxx = yyy;
```

`xxx` is a key of [options](#Options)