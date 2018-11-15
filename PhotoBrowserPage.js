import React from 'react';
import { Image, Dimensions, CameraRoll, Modal, StyleSheet, Text, View, Platform, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import Toast from 'react-native-root-toast';
import ImageViewer from 'react-native-image-zoom-viewer';
import { CustomCachedImage } from 'react-native-img-cache';
import { InnerNaviBar, getSafeAreaInset, DEFAULT_NAVBAR_HEIGHT } from 'react-native-pure-navigation-bar';

export default class extends React.PureComponent {
    static propTypes = {
        images: PropTypes.arrayOf(PropTypes.string),
        failImage: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.shape({uri: PropTypes.string.isRequired})
        ]),
        currentIndex: PropTypes.number,
        canDelete: PropTypes.bool,
        canSave: PropTypes.bool,
        okLabel: PropTypes.string,
        deleteLabel: PropTypes.string,
        saveLabel: PropTypes.string,
        saveSuccessText: PropTypes.string,
        saveFailureText: PropTypes.string,
        loadingText: PropTypes.string,
        onClose: PropTypes.func,
        supportedOrientations: PropTypes.array,
    };

    static defaultProps = {
        currentIndex: 0,
        canDelete: false,
        canSave: false,
        okLabel: 'OK',
        deleteLabel: 'Delete',
        saveLabel: 'Save',
        saveSuccessText: 'Succeed',
        saveFailureText: 'Failure',
        loadingText: 'Waiting...',
        supportedOrientations: ["portrait", "landscape"],
    };

    constructor(props) {
        super(props);
        this.currentIndex = props.currentIndex;
        this.state = {
            dataSource: [...props.images],
        };
    }

    componentDidMount() {
        Dimensions.addEventListener('change', this._onWindowChange);
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change', this._onWindowChange);
    }

    render() {
        const { onClose, supportedOrientations } = this.props;
        return (
            <Modal
                transparent={true}
                animationType='fade'
                onRequestClose={onClose}
                supportedOrientations={supportedOrientations}
            >
                {this._renderNaviBar()}
                {this._renderImageView()}
            </Modal>
        );
    }

    _renderNaviBar = () => {
        const { canDelete, canSave } = this.props;
        const items = [];
        if (canDelete) {
            items.push({
                text: this.props.okLabel,
                onPress: this._clickOk,
            });
            items.push({
                text: this.props.deleteLabel,
                onPress: this._clickDelete,
            });
        }
        if (canSave) {
            items.push({
                text: this.props.saveLabel,
                onPress: this._clickSave,
            })
        }
        const rights = {};
        if (items.length > 0) {
            rights.rightElement = items.map(item => item.text);
            rights.onRight = (index) => {
                const item = items[index];
                item.onPress();
            };
        }
        return (
            <InnerNaviBar
                style={{
                    safeView: {
                        backgroundColor: 'black',
                    },
                }}
                onLeft={() => {this.props.onClose(); return false;}}
                hasSeperatorLine={false}
                {...rights}
            />
        );
    };

    _renderImageView = () => {
        const { failImage, images } = this.props;
        const inset = getSafeAreaInset();
        const style = {
            flex: 1,
            backgroundColor: 'black',
            paddingLeft: inset.left,
            paddingRight: inset.right,
            paddingBottom: inset.bottom,
        };
        return (
            <View style={style}>
                <ImageViewer
                    index={this.currentIndex}
                    failImageSource={failImage}
                    imageUrls={images.map(url => ({url}))}
                    loadingRender={this._renderLoading}
                    renderImage={this._renderViewForImage}
                    renderIndicator={this._renderIndicator}
                    onChange={this._onChangeIndex}
                />
            </View>
        );
    };

    _renderViewForImage = (props) => {
        return (
            <CustomCachedImage
                component={Image}
                mutable={false}
                resizeMode='contain'
                {...props}
            />
        );
    };

    _renderIndicator = (index, size) => {
        return (
            <Text style={styles.indicator}>
                {index + '/' + size}
            </Text>
        );
    };

    _renderLoading = () => {
        const {width, height} = Dimensions.get('window');
        const inset = getSafeAreaInset();
        const size = 90;
        const left = (width - inset.left - inset.right - size) / 2.0;
        const top = (height - DEFAULT_NAVBAR_HEIGHT - inset.bottom - size) / 2.0;
        const style = {
            width: size,
            height: size,
            left: left,
            top: top,
        };
        return (
            <View style={[styles.container, style]}>
                <ActivityIndicator color='white' size='large' />
                <Text style={styles.toast}>
                    {this.props.loadingText}
                </Text>
            </View>
        );
    };

    _clickOk = () => {
        this.props.onClose(this.state.dataSource);
    };

    _clickDelete = () => {
        const len = this.state.dataSource.length;
        if (this.currentIndex < 0 || this.currentIndex >= len) {
            return;
        }
        const items = this.state.dataSource.splice(this.currentIndex, 1);
        this.currentIndex = this.currentIndex === len - 1 ? len - 2 : this.currentIndex;
        if (items.length > 0) {
            this.setState({
                dataSource: items,
            });
        } else {
            this.props.onClose(items);
        }
    };

    _clickSave = () => {
        const url = this.state.dataSource[this.currentIndex];
        const localUrl = Platform.OS === 'android' ? 'file://' + url : '' + url;
        CameraRoll.saveToCameraRoll(localUrl, 'photo')
            .then(() => {
                Toast.show(this.props.saveSuccessText);
            })
            .catch(() => {
                Toast.show(this.props.saveFailureText);
            });
    };

    _onChangeIndex = (index) => {
        this.currentIndex = index;
    };

    _onWindowChange = () => {
        this.forceUpdate();
    };
}

const styles = StyleSheet.create({
    indicator: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 16,
        color: 'white',
    },
    container: {
        position: 'absolute',
        backgroundColor: 'transparent',
        zIndex: 99,
        borderRadius: 6,
        backgroundColor: 'rgba(58, 58, 58, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toast: {
        color: '#fff',
        fontSize: 14,
        marginTop: 4
    },
});