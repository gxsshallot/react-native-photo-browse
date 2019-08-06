import React from 'react';
import { Image, Dimensions, CameraRoll, Modal, StyleSheet, Text, View, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import Toast from 'react-native-root-toast';
import ImageViewer from 'react-native-image-zoom-viewer';
import { InnerNaviBar, getSafeAreaInset, DEFAULT_NAVBAR_HEIGHT } from 'react-native-pure-navigation-bar';
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
        canDownload: PropTypes.bool,
        isDownloading: PropTypes.bool,
        successDownloadText: PropTypes.string,
        cancelDownloadText: PropTypes.string,
        clickdButtonIcon: PropTypes.func,
        unClickdButtonIcon: PropTypes.func,
        closeIcon: PropTypes.func
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
        isDownloading: false,
        canDownload: true,
        successDownloadText: '已保存至相册',
        cancelDownloadText: '下载已取消',
        clickdButtonIcon: () => null,
        unClickdButtonIcon: () => null,
        closeIcon: () => null
    };

    constructor(props) {
        super(props);
        this.currentIndex = props.currentIndex;
        this.state = {
            dataSource: [...props.images],
            onProgressNum: 0,
            jobId: 0,
            path: '',
            showToast: ''
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
        const { canDelete } = this.props;
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
        {this.props.canDownload && this.state.isDownloading && this._renderDownloadClose()}
        {this.props.canDownload && this.state.isDownloading &&  this._renderDownloadProgress()}
        {this.props.canDownload && this._renderDownloadButton()}
        {this.state.showToast != '' && this._renderToast()}
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
            <Text style={styles.indicator}>
            {index + '/' + size}
            </Text>
    );
    };

    _renderLoading = () => {
        const style = this._getCenterStyle();
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
            <TouchableOpacity  style={styles.downloadClose} onPress={this._stopDownload }>
            <View >
            {closeIcon}
            </View>
            </TouchableOpacity>
    );
    };

    _renderDownloadButton = () => {
        const { clickdButtonIcon, unClickdButtonIcon} = this.props;
        return (
            <TouchableOpacity  style={styles.downloadButton} onPress={!this.state.isDownloading && this._startDownload }>
    <View>
        {this.state.isDownloading ? unClickdButtonIcon : clickdButtonIcon}
        </View>
        </TouchableOpacity>
    );
    };

    _startDownload = () => {
        const { images } = this.props;
        const url = images[this.currentIndex];
        const index = url.lastIndexOf('/');
        const saveName = url.substring(index+1,url.length);
        const path = RNFS.DocumentDirectoryPath + '/' + saveName;
        const progress = data => {
            const percentage = 100 * data.bytesWritten / data.contentLength | 0;
            this.setState({
                onProgressNum: percentage,
                jobId : data.jobId
            })
            percentage === 100 && this._onFinishDownload(path);
        };
        const progressDivider = 1;
        RNFS.downloadFile({fromUrl: url, toFile: path, progress, progressDivider});
        this.setState({
            isDownloading: true,
            path: path
        })
    };

    _onFinishDownload = (path) => {
        this.setState({
            isDownloading: false,
            onProgressNum: 0,
            showToast: this.props.successDownloadText
        });
        CameraRoll.saveToCameraRoll(path,'photo').then(() => {
            RNFS.unlink(path);
        });

    };

    _stopDownload = () => {
        this.setState({
            isDownloading: false,
            onProgressNum: 0,
            showToast: this.props.cancelDownloadText
        });
        RNFS.stopDownload(this.state.jobId);
        RNFS.unlink(this.state.path);
        Toast.show(this.props.stopDownload);
    };

    _getCenterStyle = () => {
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
        return style;
    };

    _getToastCenterStyle = () => {
        const {width, height} = Dimensions.get('window');
        const inset = getSafeAreaInset();
        const size = 200;
        const left = (width - inset.left - inset.right - size) / 2.0;
        const top = (height - DEFAULT_NAVBAR_HEIGHT - inset.bottom - size) / 2.0;
        const style = {
            width: size,
            height: 50,
            left: left,
            top: top,
        };
        return style;
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
        },1000);
    }
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
    downloadClose : {
        position: 'absolute',
        top: 16,
        right: 0,
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
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
        bottom: 16,
        right: 0,
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        color: '#000'
    },

});