import React from 'react';
import RootSiblings from 'react-native-root-siblings';
import InnerPhotoBrowserPage from './PhotoBrowserPage';

let sibling = null;

export function showPhotoBrowserPage(options) {
    if (sibling) {
        return null;
    }
    sibling = new RootSiblings(
        <InnerPhotoBrowserPage
            {...options}
            onClose={(items) => {
                if (items) {
                    options.onDataChange && options.onDataChange(items);
                }
                sibling && sibling.destroy();
                sibling = null;
            }}
        />
    );
}

export const PhotoBrowserPage = InnerPhotoBrowserPage;