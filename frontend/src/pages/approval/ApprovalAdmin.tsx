import React, { useState, useEffect } from 'react';
import ApprovalTable from '../../components/ApprovalTable';
import { Box, Button, Paper, Stack, Toolbar, Typography, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { 
  approvalService, 
  type ApprovalListRequest, 
  type ApprovalDto, 
} from '../../services/approvalService';

import type { PaginationResponse } from '../../services/api';
import type { GridRowId } from '@mui/x-data-grid';
import ApiClient from '../../utils/apiClient';
import { TokenManager } from '../../utils/tokenUtils';

//관리자,팀장용 결재 리스트
//결재 : 사원,팀장은 admin, admin은 다른 admin에게 결재 가능
export default function ApprovalAdmin() {
  const navigate = useNavigate();
  
  // 상태 관리
  const [data, setData] = useState<PaginationResponse<ApprovalDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([]); // 선택된 항목들

  // 페이지네이션 및 필터 상태
  const [params, setParams] = useState<ApprovalListRequest>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // 테스트용 사용자 정보 - 하드코딩
  const getCurrentUserInfo = () => {
    // 테스트용 고정값
    return {
      userId: 'EMP001',
      role: 'admin'
    };
    
    // TODO: 나중에 실제 토큰에서 정보를 추출하도록 변경
    // const token = TokenManager.getToken();
    // if (!token) return { userId: null, role: null };
    // 
    // try {
    //   const payload = JSON.parse(atob(token.split('.')[1]));
    //   return {
    //     userId: payload.userId || payload.sub || payload.id,
    //     role: payload.role || payload.Role
    //   };
    // } catch (error) {
    //   console.error('토큰 파싱 실패:', error);
    //   return { userId: null, role: null };
    // }
  };

  // 데이터 가져오기 함수 - ApiClient 직접 사용
  const fetchApprovals = async (requestParams: ApprovalListRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const { userId, role } = getCurrentUserInfo();
      
      // URL 파라미터 구성
      const queryParams = new URLSearchParams({
        page: requestParams.page.toString(),
        pageSize: requestParams.pageSize.toString(),
        sortBy: requestParams.sortBy || 'createdAt',
        sortOrder: requestParams.sortOrder || 'desc',
        ...(userId && { userId: userId.toString() }),
        ...(role && { role: role }),
        ...(requestParams.status && { status: requestParams.status }),
        ...(requestParams.type && { type: requestParams.type }),
        ...(requestParams.startDate && { startDate: requestParams.startDate }),
        ...(requestParams.endDate && { endDate: requestParams.endDate })
      });

      console.log('📤 테스트용 고정값으로 API 요청:', {
        userId: 'EMP001',
        role: 'admin',
        requestParams,
        queryString: queryParams.toString()
      });

      // ApiClient를 사용하여 토큰과 함께 요청
      const result = await ApiClient.getJson<PaginationResponse<ApprovalDto>>(
        `/Approval?${queryParams.toString()}`
      );
      
      setData(result);
      console.log('Approvals fetched successfully:', result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드 및 params 변경시 데이터 재로드
  useEffect(() => {
    fetchApprovals(params);
  }, [params]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setParams(prev => ({ ...prev, page: newPage }));
  };

  // 정렬 변경 핸들러
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  // 필터 변경 핸들러
  const handleFilterChange = (filters: Partial<ApprovalListRequest>) => {
    setParams(prev => ({ ...prev, ...filters, page: 1 }));
  };

  // 선택된 항목 삭제 - ApiClient 사용
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }

    if (!window.confirm(`선택한 ${selectedIds.length}개 항목을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      
      // ApiClient를 사용하여 토큰과 함께 삭제 요청
      const idsAsNumbers = selectedIds.map(id => Number(id)).filter(id => !isNaN(id));
      
      // 각 항목을 개별적으로 삭제 (또는 백엔드에 bulk delete API가 있다면 사용)
      for (const id of idsAsNumbers) {
        await ApiClient.delete(`/Approval/${id}`);
      }
      
      // 성공 후 데이터 새로고침 및 선택 초기화
      await fetchApprovals(params);
      setSelectedIds([]);
      alert('삭제가 완료되었습니다.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.';
      alert(errorMessage);
      console.error('Delete failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    fetchApprovals(params);
  };

  // 선택 변경 핸들러 - GridRowId[] 타입 처리
  const handleSelectionChange = (ids: GridRowId[]) => {
    setSelectedIds(ids);
  };

  // 결재 승인/거부 핸들러 - ApiClient 사용
  const handleApprovalAction = async (id: number, action: 'approve' | 'reject', comment?: string) => {
    try {
      setLoading(true);
      
      // ApiClient를 사용하여 토큰과 함께 결재 처리 요청
      const requestData = {
        comment: comment || ''
      };

      if (action === 'approve') {
        await ApiClient.postJson(`/Approval/${id}/approve`, requestData);
      } else {
        await ApiClient.postJson(`/Approval/${id}/reject`, requestData);
      }
      
      // 성공 후 데이터 새로고침
      await fetchApprovals(params);
      alert(`결재가 ${action === 'approve' ? '승인' : '거부'}되었습니다.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.';
      alert(errorMessage);
      console.error('Approval action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 추가적인 API 호출 예시 - 결재 상태 일괄 변경
  const handleBulkStatusChange = async (status: 'pending' | 'approved' | 'rejected') => {
    if (selectedIds.length === 0) {
      alert('변경할 항목을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const idsAsNumbers = selectedIds.map(id => Number(id)).filter(id => !isNaN(id));
      
      // ApiClient를 사용하여 토큰과 함께 상태 변경 요청
      await ApiClient.putJson('/Approval/bulk-status', {
        ids: idsAsNumbers,
        status: status
      });
      
      // 성공 후 데이터 새로고침 및 선택 초기화
      await fetchApprovals(params);
      setSelectedIds([]);
      alert(`선택한 항목의 상태가 ${status}로 변경되었습니다.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '상태 변경 중 오류가 발생했습니다.';
      alert(errorMessage);
      console.error('Bulk status change failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // 에러만 있고 데이터가 없는 경우 (초기 로딩 실패)
  if (error && !data) {
    return (
      <Box sx={{ maxWidth: 'xl', mx: 'auto', my: 4, mt: 10, px: 2 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              다시 시도
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 'xl', mx: 'auto', my: 4, mt: 10, px: 2 }}>
      <Toolbar sx={{ justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">결재 관리</Typography>
        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/approval/request')}
            sx={{
              backgroundColor: '#fff',
              '&:hover': {
                backgroundColor: '#1976D2',
                color: '#fff',
                borderColor: '#2E6C4D'
              }
            }}
          >
            결재 생성
            {/* 관리자는 결재 생성이 필요할까? */}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ backgroundColor: '#fff' }}
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0 || loading}
          >
            선택 삭제 ({selectedIds.length})
          </Button>
        </Stack>
      </Toolbar>

      <Paper sx={{ p: 3 }}>
        {/* 로딩 중이거나 에러가 있는 경우 상태 표시 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography variant="body2">
              {data ? '데이터를 업데이트하는 중...' : '데이터를 불러오는 중...'}
            </Typography>
          </Box>
        )}

        {error && data && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 데이터가 없는 경우 */}
        {!loading && !data && !error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              표시할 데이터가 없습니다.
            </Typography>
            <Button onClick={handleRefresh} sx={{ mt: 2 }}>
              새로고침
            </Button>
          </Box>
        )}

        {/* 테이블 - 조건부 렌더링으로 안전성 확보 */}
        {data && data.items && Array.isArray(data.items) && (
          <>
            {/* 디버깅용 정보 표시 */}
            <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                디버깅 정보: rows={data.items?.length || 0}, totalCount={data.totalCount || 0}, 
                page={data.page || 0}, pageSize={data.pageSize || 0}
              </Typography>
            </Box>
            
            <ApprovalTable
              key={`approval-table-${data.page}-${data.pageSize}-${data.totalCount}`}
              rows={data.items || []}
              totalCount={data.totalCount || 0}
              page={data.page || 1}
              pageSize={data.pageSize || 10}
              totalPages={data.totalPages || 1}
              hasNextPage={data.hasNextPage || false}
              hasPreviousPage={data.hasPreviousPage || false}
              selectedIds={selectedIds || []}
              onSelectionChange={handleSelectionChange}
              onDetail={(id) => navigate(`/approval/${id}`, { state: { canEdit: true } })}
              onPageChange={handlePageChange}
              onSortChange={handleSortChange}
              onFilterChange={handleFilterChange}
              onApprovalAction={handleApprovalAction}
              onRefresh={handleRefresh}
              dataType="approval"
              showActions={true}
              showCheckbox={true}
              loading={loading}
            />
          </>
        )}

        {/* 데이터는 있지만 items가 없는 경우 */}
        {data && (!data.items || !Array.isArray(data.items)) && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary">
              데이터 형식에 문제가 있습니다.
            </Typography>
            <Button onClick={handleRefresh} sx={{ mt: 2 }}>
              새로고침
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}