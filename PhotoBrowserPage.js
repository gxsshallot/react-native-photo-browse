import React from 'react';
import { ActivityIndicator, Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import PropTypes from 'prop-types';
import Toast from 'react-native-root-toast';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Circle } from 'react-native-progress';
import RNFS from 'react-native-fs';

export default class extends React.PureComponent {
    static propTypes = {
        images: PropTypes.arrayOf(PropTypes.string),
        failImage: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.shape({uri: PropTypes.string.isRequired})
        ]),
        currentIndex: PropTypes.number,
        loadingText: PropTypes.string,
        onClose: PropTypes.func,
        supportedOrientations: PropTypes.array,
        canDownload: PropTypes.bool,
        successDownloadText: PropTypes.string,
        cancelDownloadText: PropTypes.string,
        clickdButtonIcon: PropTypes.node,
        unClickdButtonIcon: PropTypes.node,
        closeIcon: PropTypes.node,
        startDownload: PropTypes.func,
        cancelDownload: PropTypes.func,
        renderIndicator: PropTypes.func,
        loadingRender: PropTypes.func
    };

    static defaultProps = {
        currentIndex: 0,
        loadingText: 'Waiting...',
        supportedOrientations: ["portrait", "landscape"],
        canDownload: true,
        successDownloadText: '已保存至相册',
        cancelDownloadText: '下载已取消',
        clickdButtonIcon: null,
        unClickdButtonIcon: null,
        closeIcon: null,
        startDownload: () => null,
        cancelDownload: () => null,
        getAuthHeader: () => {},
    };

    constructor(props) {
        super(props);
        this.currentIndex = props.currentIndex;
        this.state = {
            dataSource: [...props.images],
            onProgressNum: 0,
            showToast: '',
            hasCancel: false
        };
    }

    componentDidMount() {
        Dimensions.addEventListener('change', this._onWindowChange);
    }

    componentWillUnmount() {
        Dimensions.removeEventListener('change', this._onWindowChange);
    }

    render() {
        const {onClose, supportedOrientations, failImage, images, renderIndicator, loadingRender, renderImage, getAuthHeader} = this.props;
        return (
            <Modal
                transparent={true}
                animationType='fade'
                onRequestClose={onClose}
                supportedOrientations={supportedOrientations}
            >
                <View style={styles.layout}>
                    <ImageViewer
                        index={this.currentIndex}
                        failImageSource={failImage}
                        imageUrls={images.map(url => ({url, ...getAuthHeader(url)}))}
                        loadingRender={loadingRender || this._renderLoading}
                        renderImage={renderImage || this._renderViewForImage}
                        renderIndicator={renderIndicator || this._renderIndicator}
                        onChange={this._onChangeIndex}
                        onCancel={onClose}
                        enableSwipeDown={true}
                        onClick={() => onClose && onClose()}
                    />
                    {this.props.canDownload && this._renderDownloadButton()}
                    {this.props.canDownload && this.state.isDownloading && this._renderDownloadClose()}
                    {this.props.canDownload && this.state.isDownloading && this._renderDownloadProgress()}
                    {this.state.showToast !== '' && this._renderToast()}
                    {this.props.canDownload && this.state.isDownloading && this._renderCannotTouch()}
                </View>
            </Modal>
        );
    }

    _renderCannotTouch = () => {
        return (
            <View style={[styles.cannotTouch]}>
            </View>
        );
    };

    _renderViewForImage = (props) => {
        return (
            <Image
                resizeMode='contain'
                {...props}
            />
        );
    };

    _renderIndicator = (index, size) => {
        return (
            <View>
                <Text style={styles.indicator}>
                    {index + '/' + size}
                </Text>
            </View>
        );
    };

    _renderLoading = () => {
        const style = this._getCenterStyle();
        return (
            <View style={[styles.container, style]}>
                <ActivityIndicator color='white' size='large'/>
                <Text style={styles.toast}>
                    {this.props.loadingText}
                </Text>
            </View>
        );
    };

    _onChangeIndex = (index) => {
        this.currentIndex = index;
    };

    _onWindowChange = () => {
        this.forceUpdate();
    };


    _renderDownloadProgress = () => {
        const style = this._getCenterStyle();
        const {onProgressNum} = this.state;
        return (
            <View style={[styles.downloadProgress, style]}>
                <Circle
                    style={{
                        borderRadius: 42,
                        width: 84,
                        height: 84
                    }}
                    size={84} // 圆的直径
                    progress={onProgressNum * 0.01} // 进度
                    unfilledColor="rgba(255,255,255,0.5)" // 剩余进度的颜色
                    color={"#008aff"} // 颜色
                    thickness={6} // 内圆厚度
                    direction="clockwise" // 方向
                    borderWidth={0} // 边框
                    showsText={true}
                    formatText={() => `${onProgressNum}%`}
                    textStyle={styles.progressText}
                />
            </View>
        );
    };


    _renderDownloadClose = () => {
        const {closeIcon} = this.props;
        return (
            <TouchableOpacity style={styles.downloadClose} onPress={this._stopDownload}>
                <View>
                    {closeIcon}
                </View>
            </TouchableOpacity>
        );
    };


    _renderDownloadButton = () => {
        const {clickdButtonIcon, unClickdButtonIcon} = this.props;
        return (
            <TouchableOpacity style={styles.downloadButton} onPress={() => this._downLoadFile()}>
                <View>
                    {this.state.isDownloading ? unClickdButtonIcon : clickdButtonIcon}
                </View>
            </TouchableOpacity>
        );
    };

    _downLoadFile = () => {
        const {images} = this.props;
        const url = images[this.currentIndex];
        this.setState({
            isDownloading: true,
            hasCancel: false
        });
        this.props.startDownload(url, (progress) => {
            this.setState({
                onProgressNum: progress,
            })
        }, (res, path) => {
            !this.state.hasCancel && this._onFinishDownload(path);
        }, () => { //下载失败
            this.setState({
                isDownloading: false,
                onProgressNum: 0
            });
        });
    };


    _onFinishDownload = (path) => {
        this.setState({
            isDownloading: false,
            onProgressNum: 0,
            showToast: this.props.successDownloadText
        });
        CameraRoll.saveToCameraRoll(path, 'photo').then(() => {
            RNFS.unlink(path);
        });
    };

    _stopDownload = () => {
        this.setState({
            isDownloading: false,
            onProgressNum: 0,
            showToast: this.props.cancelDownloadText,
            hasCancel: true
        });
        Toast.show(this.props.stopDownload);
    };


    _getCenterStyle = () => {
        const {width, height} = Dimensions.get('window');
        const size = 90;
        const left = (width - size) / 2.0;
        const top = (height - size) / 2.0;
        return {
            width: size,
            height: size,
            left: left,
            top: top,
        };
    };

    _getToastCenterStyle = () => {
        const {width, height} = Dimensions.get('window');
        const size = 200;
        const left = (width - size) / 2.0;
        const top = (height - size) / 2.0;
        return {
            width: size,
            height: 50,
            left: left,
            top: top,
        };
    };

    _renderToast = () => {
        this._startTime();
        const style = this._getToastCenterStyle();
        return (
            <View style={[styles.toastView, style]}>
                <Text style={styles.toastText}>{this.state.showToast}</Text>
            </View>
        );
    };

    _startTime = () => {
        setTimeout(() => {
            this.setState({
                showToast: ''
            })
        }, 1000);
    }
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
    layout: {flex: 1, backgroundColor: 'black'},
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
    downloadClose: {
        position: 'absolute',
        top: 16,
        right: 0,
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    downloadProgress: {
        position: 'absolute',
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toastView: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(58, 58, 58, 0.9)',
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
    },
    downloadButton: {
        position: 'absolute',
        bottom: 32,
        right: 32,
        width: 36,
        height: 36,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        color: '#000'
    },
    cannotTouch: {
        position: 'absolute',
        zIndex: 99,
        width: screenWidth,
        height: screenHeight
    },

});
